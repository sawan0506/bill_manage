import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';
import { StockMovement } from '../models/StockMovement.js';
import { CreditNote } from '../models/CreditNote.js';
import { Settings } from '../models/Settings.js';
import { getNextSequence } from '../models/Counter.js';
import { calculateBillTotals } from '../utils/billingCalculator.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { logAudit } from '../utils/auditLogger.js';

export const createBill = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress = '',
      customerGstin = '',
      items: itemInputs,
      paymentMode,
      paidAmount: inputPaidAmount,
      isInterState = false,
      notes = '',
      idempotencyKey
    } = req.body;

    // Check idempotency to prevent accidental double-submits
    if (idempotencyKey) {
      const existing = await Bill.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Bill already processed.',
          data: existing
        });
      }
    }

    const settings = (await Settings.findOne()) || {};
    const enableGst = settings.enableGst !== false;

    // Validate and fetch all products from DB (NEVER trust client prices/tax)
    const productIds = itemInputs.map((i) => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));

    for (const input of itemInputs) {
      const p = productMap.get(String(input.productId));
      if (!p) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${input.productId} was not found.`
        });
      }
      if (!p.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${p.name}" is deactivated and cannot be billed.`
        });
      }
    }

    // Construct authoritative line item objects from DB prices
    const rawItems = itemInputs.map((input) => {
      const prod = productMap.get(String(input.productId));
      return {
        product: prod._id,
        name: prod.name,
        category: prod.category,
        brand: prod.brand,
        sizeModel: prod.sizeModel,
        unit: prod.unit,
        hsnCode: prod.hsnCode,
        quantity: input.quantity,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        discountType: input.discountType || 'amount',
        discountValue: input.discountValue || 0,
        taxRate: enableGst ? prod.gstRate : 0
      };
    });

    // Determine paid amount based on payment mode
    let initialPaid = Number(inputPaidAmount) || 0;
    if (paymentMode === 'Cash' || paymentMode === 'UPI' || paymentMode === 'Card') {
      // If full payment mode selected and no custom paid amount passed, assume full
      if (initialPaid === 0) {
        // Will be set to grand total after calculations
        initialPaid = -1; // Flag for auto full pay
      }
    } else if (paymentMode === 'Credit') {
      initialPaid = 0;
    }

    // Compute bill totals
    const calculation = calculateBillTotals(rawItems, {
      isInterState,
      enableGst,
      paidAmount: initialPaid === -1 ? 0 : initialPaid
    });

    // If auto full pay flag was set, mark fully paid
    if (initialPaid === -1) {
      calculation.paidAmount = calculation.grandTotal;
      calculation.balanceDue = 0;
      calculation.paymentStatus = 'paid';
    }

    // Generate unique sequential invoice number
    const invoicePrefix = settings.invoicePrefix || 'INV';
    const invoiceNumber = await getNextSequence('invoice', invoicePrefix, 5);

    // Customer resolution (find or create)
    let customerDoc = null;
    if (customerId) {
      customerDoc = await Customer.findById(customerId);
    }
    if (!customerDoc && customerPhone) {
      customerDoc = await Customer.findOne({ phone: customerPhone.trim() });
    }
    if (!customerDoc && customerName && customerPhone) {
      customerDoc = await Customer.create({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress ? customerAddress.trim() : '',
        gstin: customerGstin ? customerGstin.trim().toUpperCase() : ''
      });
    }

    // Create the Bill document
    const bill = await Bill.create({
      invoiceNumber,
      date: new Date(),
      customer: {
        id: customerDoc ? customerDoc._id : null,
        name: customerDoc ? customerDoc.name : customerName.trim(),
        phone: customerDoc ? customerDoc.phone : customerPhone.trim(),
        address: customerDoc ? customerDoc.address : customerAddress.trim(),
        gstin: customerDoc ? customerDoc.gstin : customerGstin.trim()
      },
      items: calculation.items,
      isInterState,
      subtotal: calculation.subtotal,
      totalDiscount: calculation.totalDiscount,
      taxableAmount: calculation.taxableAmount,
      cgstAmount: calculation.cgstAmount,
      sgstAmount: calculation.sgstAmount,
      igstAmount: calculation.igstAmount,
      totalTax: calculation.totalTax,
      roundOff: calculation.roundOff,
      grandTotal: calculation.grandTotal,
      paidAmount: calculation.paidAmount,
      balanceDue: calculation.balanceDue,
      paymentMode,
      paymentStatus: calculation.paymentStatus,
      status: 'completed',
      notes,
      createdBy: req.user._id,
      createdByName: req.user.name,
      createdByRole: req.user.role,
      idempotencyKey
    });

    // Deduct stock & create Stock Movements
    for (const item of bill.items) {
      const prod = productMap.get(String(item.product));
      const prevStock = prod.stockQuantity;
      const newStock = Math.max(0, prevStock - item.quantity);

      await Product.findByIdAndUpdate(prod._id, { $inc: { stockQuantity: -item.quantity } });

      await StockMovement.create({
        product: prod._id,
        productName: prod.name,
        type: 'OUT',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        referenceType: 'Bill',
        referenceId: bill._id,
        referenceNumber: bill.invoiceNumber,
        reason: `Sold via Bill ${bill.invoiceNumber}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      });
    }

    // If there is pending balance (Udhaar), update Customer balance
    if (calculation.balanceDue > 0 && customerDoc) {
      await Customer.findByIdAndUpdate(customerDoc._id, {
        $inc: { balanceDue: calculation.balanceDue }
      });
    }

    // If money was paid on spot, record Payment receipt
    if (calculation.paidAmount > 0 && customerDoc) {
      const receiptPrefix = 'REC';
      const receiptNumber = await getNextSequence('receipt', receiptPrefix, 5);
      await Payment.create({
        receiptNumber,
        customer: customerDoc._id,
        customerName: customerDoc.name,
        bill: bill._id,
        amount: calculation.paidAmount,
        paymentMode: paymentMode === 'Credit' || paymentMode === 'Partial' ? 'Cash' : paymentMode,
        customerPreviousBalance: customerDoc.balanceDue,
        customerNewBalance: customerDoc.balanceDue + calculation.balanceDue,
        notes: `Initial payment for Bill ${bill.invoiceNumber}`,
        receivedBy: req.user._id,
        receivedByName: req.user.name
      });
    }

    await logAudit({
      action: 'BILL_CREATE',
      resourceType: 'Bill',
      resourceId: bill._id,
      req,
      user: req.user,
      details: {
        invoiceNumber: bill.invoiceNumber,
        grandTotal: bill.grandTotal,
        paidAmount: bill.paidAmount,
        balanceDue: bill.balanceDue,
        itemsCount: bill.items.length
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully.',
      data: bill
    });
  } catch (err) {
    next(err);
  }
};

export const listBills = async (req, res, next) => {
  try {
    const {
      search = '',
      status = '',
      paymentStatus = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 25
    } = req.query;

    const query = {};

    // Staff can only view all bills or own bills
    if (req.user.role === 'staff') {
      // Allow staff to view bills, but mask purchase prices
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { invoiceNumber: { $regex: s, $options: 'i' } },
        { 'customer.name': { $regex: s, $options: 'i' } },
        { 'customer.phone': { $regex: s, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.date.$lte = eDate;
      }
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [bills, totalCount] = await Promise.all([
      Bill.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Bill.countDocuments(query)
    ]);

    // Mask purchasePrice from items for staff
    const sanitizedBills = bills.map((b) => {
      if (req.user.role !== 'admin') {
        const items = b.items.map(({ purchasePrice, ...rest }) => rest);
        return { ...b, items };
      }
      return b;
    });

    res.status(200).json({
      success: true,
      data: sanitizedBills,
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

export const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      });
    }

    const billObj = bill.toObject();
    if (req.user.role !== 'admin') {
      billObj.items = billObj.items.map(({ purchasePrice, ...rest }) => rest);
    }

    res.status(200).json({
      success: true,
      data: billObj
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Download Invoice as PDF
 */
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      });
    }

    const settings = (await Settings.findOne()) || {};
    const pdfBuffer = await generateInvoicePDF(bill, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Invoice-${bill.invoiceNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Generate WhatsApp share link with invoice breakdown
 */
export const getInvoiceWhatsAppLink = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      });
    }

    const settings = (await Settings.findOne()) || {};
    const shopName = settings.shopName || 'Kisan Hardware';

    const cleanPhone = (bill.customer?.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemListText = bill.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} (${it.quantity} ${it.unit}) - ₹${it.totalAmount.toFixed(2)}`
      )
      .join('\n');

    const message = `*INVOICE: ${bill.invoiceNumber}*\n*From:* ${shopName}\n*Customer:* ${bill.customer?.name}\n*Date:* ${new Date(bill.date).toLocaleDateString('en-IN')}\n\n*Items:*\n${itemListText}\n\n*Grand Total:* ₹${bill.grandTotal.toFixed(2)}\n*Amount Paid:* ₹${bill.paidAmount.toFixed(2)}\n*Balance Due:* ₹${bill.balanceDue.toFixed(2)}\n*Payment Status:* ${bill.paymentStatus.toUpperCase()}\n\nThank you for shopping with us!`;

    const encoded = encodeURIComponent(message);
    const link = `https://wa.me/${phoneWithCountry}?text=${encoded}`;

    res.status(200).json({
      success: true,
      data: {
        invoiceNumber: bill.invoiceNumber,
        customerName: bill.customer?.name,
        whatsappLink: link,
        messageText: message
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel Bill (Admin only)
 * Restores inventory stock and balances customer ledger
 */
export const cancelBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      });
    }

    if (bill.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This bill is already cancelled.'
      });
    }

    // Restore stock for all items
    for (const item of bill.items) {
      const prod = await Product.findById(item.product);
      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity += item.quantity;
        await prod.save();

        await StockMovement.create({
          product: prod._id,
          productName: prod.name,
          type: 'CANCEL',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          referenceType: 'Bill',
          referenceId: bill._id,
          referenceNumber: bill.invoiceNumber,
          reason: `Bill Cancelled: ${reason}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        });
      }
    }

    // Revert customer pending balance if bill had credit
    if (bill.balanceDue > 0 && bill.customer?.id) {
      await Customer.findByIdAndUpdate(bill.customer.id, {
        $inc: { balanceDue: -bill.balanceDue }
      });
    }

    bill.status = 'cancelled';
    bill.cancellationReason = reason;
    bill.cancelledBy = req.user._id;
    bill.cancelledAt = new Date();
    await bill.save();

    await logAudit({
      action: 'BILL_CANCEL',
      resourceType: 'Bill',
      resourceId: bill._id,
      req,
      user: req.user,
      details: {
        invoiceNumber: bill.invoiceNumber,
        reason,
        grandTotal: bill.grandTotal,
        restoredItems: bill.items.length
      }
    });

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully. Stock has been restored.',
      data: bill
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sales Return / Credit Note (Admin or Staff)
 */
export const processSalesReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items: returnItems, refundMode = 'Credit Adjustment', notes = '' } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      });
    }

    if (bill.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process returns on a cancelled bill.'
      });
    }

    if (!Array.isArray(returnItems) || returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select items to return.'
      });
    }

    let totalRefund = 0;
    const processedReturnItems = [];

    for (const rItem of returnItems) {
      const origItem = bill.items.find(
        (it) => String(it.product) === String(rItem.productId)
      );

      if (!origItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in original bill.`
        });
      }

      const returnQty = Number(rItem.quantity) || 0;
      if (returnQty <= 0 || returnQty > origItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid return quantity for ${origItem.name}. Maximum is ${origItem.quantity}.`
        });
      }

      // Proportional refund calculation
      const itemUnitRefund = origItem.totalAmount / origItem.quantity;
      const itemTotalRefund = Math.round(itemUnitRefund * returnQty * 100) / 100;
      totalRefund += itemTotalRefund;

      processedReturnItems.push({
        product: origItem.product,
        name: origItem.name,
        quantity: returnQty,
        unitPrice: origItem.sellingPrice,
        taxRate: origItem.taxRate,
        taxAmount: Math.round((origItem.totalTax / origItem.quantity) * returnQty * 100) / 100,
        totalAmount: itemTotalRefund,
        reason: rItem.reason || 'Customer return'
      });

      // Restore product stock
      const prod = await Product.findById(origItem.product);
      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity += returnQty;
        await prod.save();

        await StockMovement.create({
          product: prod._id,
          productName: prod.name,
          type: 'RETURN',
          quantity: returnQty,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          referenceType: 'CreditNote',
          referenceNumber: bill.invoiceNumber,
          reason: `Returned from Bill ${bill.invoiceNumber}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        });
      }
    }

    // Generate credit note number
    const creditNoteNumber = await getNextSequence('credit_note', 'CN', 5);

    const creditNote = await CreditNote.create({
      creditNoteNumber,
      originalBill: bill._id,
      originalInvoiceNumber: bill.invoiceNumber,
      customer: bill.customer?.id,
      customerName: bill.customer?.name || 'Walk-in',
      items: processedReturnItems,
      totalRefundAmount: Math.round(totalRefund * 100) / 100,
      refundMode,
      notes,
      createdBy: req.user._id,
      createdByName: req.user.name
    });

    // If customer has credit ledger and mode is Credit Adjustment, reduce balance
    if (refundMode === 'Credit Adjustment' && bill.customer?.id) {
      await Customer.findByIdAndUpdate(bill.customer.id, {
        $inc: { balanceDue: -totalRefund }
      });
    }

    await logAudit({
      action: 'SALES_RETURN',
      resourceType: 'CreditNote',
      resourceId: creditNote._id,
      req,
      user: req.user,
      details: {
        creditNoteNumber,
        originalInvoiceNumber: bill.invoiceNumber,
        totalRefundAmount: totalRefund
      }
    });

    res.status(201).json({
      success: true,
      message: 'Return processed and Credit Note issued successfully.',
      data: creditNote
    });
  } catch (err) {
    next(err);
  }
};
