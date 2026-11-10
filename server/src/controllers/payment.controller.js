import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { Bill } from '../models/Bill.js';
import { getNextSequence } from '../models/Counter.js';
import { logAudit } from '../utils/auditLogger.js';

export const recordPayment = async (req, res, next) => {
  try {
    const { customerId, billId, amount, paymentMode, transactionRef = '', notes = '' } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.'
      });
    }

    const receiptNumber = await getNextSequence('receipt', 'REC', 5);
    const prevBalance = customer.balanceDue;
    const newBalance = Math.round((prevBalance - payAmount) * 100) / 100;

    customer.balanceDue = newBalance;
    await customer.save();

    // If payment was made against a specific bill, update the bill's paidAmount/balanceDue
    if (billId) {
      const bill = await Bill.findById(billId);
      if (bill) {
        bill.paidAmount = Math.round((bill.paidAmount + payAmount) * 100) / 100;
        bill.balanceDue = Math.max(0, Math.round((bill.grandTotal - bill.paidAmount) * 100) / 100);
        if (bill.balanceDue === 0) {
          bill.paymentStatus = 'paid';
        } else {
          bill.paymentStatus = 'partial';
        }
        await bill.save();
      }
    }

    const payment = await Payment.create({
      receiptNumber,
      customer: customer._id,
      customerName: customer.name,
      bill: billId || null,
      amount: payAmount,
      paymentMode,
      transactionRef,
      customerPreviousBalance: prevBalance,
      customerNewBalance: newBalance,
      notes,
      receivedBy: req.user._id,
      receivedByName: req.user.name
    });

    await logAudit({
      action: 'PAYMENT_RECORD',
      resourceType: 'Payment',
      resourceId: payment._id,
      req,
      user: req.user,
      details: {
        receiptNumber,
        customerName: customer.name,
        amount: payAmount,
        prevBalance,
        newBalance
      }
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount} recorded successfully.`,
      data: payment
    });
  } catch (err) {
    next(err);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const { customerId = '', startDate = '', endDate = '', page = 1, limit = 25 } = req.query;

    const query = {};
    if (customerId) {
      query.customer = customerId;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = eDate;
      }
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('customer', 'name phone')
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: payments,
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
