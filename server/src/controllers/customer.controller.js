import { Customer } from '../models/Customer.js';
import { Bill } from '../models/Bill.js';
import { Payment } from '../models/Payment.js';
import { Settings } from '../models/Settings.js';
import { logAudit } from '../utils/auditLogger.js';

export const listCustomers = async (req, res, next) => {
  try {
    const { search = '', hasDues = 'false', page = 1, limit = 50 } = req.query;

    const query = { isActive: true };

    if (hasDues === 'true') {
      query.balanceDue = { $gt: 0 };
    }

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [customers, totalCount] = await Promise.all([
      Customer.find(query)
        .sort({ balanceDue: -1, name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Customer.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const [bills, payments] = await Promise.all([
      Bill.find({ 'customer.phone': customer.phone, status: 'completed' })
        .sort({ date: -1 })
        .limit(10)
        .select('invoiceNumber date grandTotal paidAmount balanceDue paymentMode')
        .lean(),
      Payment.find({ customer: customer._id })
        .sort({ paymentDate: -1 })
        .limit(10)
        .select('receiptNumber paymentDate amount paymentMode')
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        customer,
        recentBills: bills,
        recentPayments: payments
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerLedger = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const [bills, payments] = await Promise.all([
      Bill.find({
        $or: [{ 'customer.id': customer._id }, { 'customer.phone': customer.phone }],
        status: { $ne: 'cancelled' }
      })
        .sort({ date: 1 })
        .lean(),
      Payment.find({ customer: customer._id })
        .sort({ paymentDate: 1 })
        .lean()
    ]);

    // Build timeline ledger
    const ledger = [];

    bills.forEach((b) => {
      ledger.push({
        type: 'INVOICE',
        id: b._id,
        referenceNumber: b.invoiceNumber,
        date: b.date,
        description: `Bill ${b.invoiceNumber} (${b.items.length} items)`,
        debit: b.grandTotal, // customer owes
        credit: b.paidAmount, // paid on spot
        balanceChange: b.balanceDue,
        status: b.paymentStatus
      });
    });

    payments.forEach((p) => {
      ledger.push({
        type: 'PAYMENT',
        id: p._id,
        referenceNumber: p.receiptNumber,
        date: p.paymentDate,
        description: `Payment received (${p.paymentMode})`,
        debit: 0,
        credit: p.amount,
        balanceChange: -p.amount,
        notes: p.notes
      });
    });

    // Sort combined ledger chronologically
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    const ledgerWithRunningBalance = ledger.map((entry) => {
      runningBalance += entry.balanceChange;
      return {
        ...entry,
        runningBalance: Math.round(runningBalance * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      data: {
        customer,
        currentBalance: customer.balanceDue,
        ledger: ledgerWithRunningBalance.reverse() // Most recent first for display
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, gstin, notes } = req.body;

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A customer with phone number ${phone} already exists (${existing.name}).`
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      address: address ? address.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      notes: notes ? notes.trim() : ''
    });

    await logAudit({
      action: 'CUSTOMER_CREATE',
      resourceType: 'Customer',
      resourceId: customer._id,
      req,
      user: req.user,
      details: { name: customer.name, phone: customer.phone }
    });

    res.status(201).json({
      success: true,
      message: 'Customer added successfully.',
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    Object.assign(customer, req.body);
    await customer.save();

    await logAudit({
      action: 'CUSTOMER_UPDATE',
      resourceType: 'Customer',
      resourceId: customer._id,
      req,
      user: req.user,
      details: { name: customer.name, phone: customer.phone }
    });

    res.status(200).json({
      success: true,
      message: 'Customer details updated.',
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate WhatsApp payment reminder link
 */
export const getWhatsAppReminderLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    if (customer.balanceDue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer has no outstanding dues.'
      });
    }

    const settings = (await Settings.findOne()) || {};
    const shopName = settings.shopName || 'Kisan Hardware & Sanitary Mart';
    const upiId = settings.upiId || '';

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `Namaste ${customer.name} ji,\n\nThis is a gentle reminder from *${shopName}* regarding your pending bill balance of *₹${customer.balanceDue.toFixed(2)}*.\n\nPlease clear the balance at your earliest convenience.\n${upiId ? `You can pay via UPI to: *${upiId}*\n` : ''}\nThank you for doing business with us!`;

    const encodedMessage = encodeURIComponent(message);
    const link = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;

    res.status(200).json({
      success: true,
      data: {
        customerName: customer.name,
        phone: customer.phone,
        balanceDue: customer.balanceDue,
        whatsappLink: link,
        messageText: message
      }
    });
  } catch (err) {
    next(err);
  }
};
