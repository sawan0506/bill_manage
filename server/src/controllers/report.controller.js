import { Bill } from '../models/Bill.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { Payment } from '../models/Payment.js';

/**
 * Dashboard top cards and quick glance metrics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayBills, pendingCustomers, lowStockCount, recentBills] = await Promise.all([
      Bill.find({
        date: { $gte: todayStart, $lte: todayEnd },
        status: 'completed'
      }).select('grandTotal paidAmount balanceDue items'),
      Customer.aggregate([
        { $match: { balanceDue: { $gt: 0 }, isActive: true } },
        {
          $group: {
            _id: null,
            totalPending: { $sum: '$balanceDue' },
            count: { $sum: 1 }
          }
        }
      ]),
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$stockQuantity', '$lowStockLevel'] }
      }),
      Bill.find({ status: 'completed' })
        .sort({ date: -1 })
        .limit(5)
        .select('invoiceNumber date customer grandTotal paymentMode paymentStatus')
        .lean()
    ]);

    const todaySales = todayBills.reduce((acc, b) => acc + b.grandTotal, 0);
    const todayReceived = todayBills.reduce((acc, b) => acc + b.paidAmount, 0);
    const todayBillsCount = todayBills.length;
    const totalPendingDues = pendingCustomers[0]?.totalPending || 0;
    const pendingCustomersCount = pendingCustomers[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        todayReceived: Math.round(todayReceived * 100) / 100,
        todayBillsCount,
        totalPendingDues: Math.round(totalPendingDues * 100) / 100,
        pendingCustomersCount,
        lowStockCount,
        recentBills
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sales Analytics (Admin only)
 */
export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const query = { status: 'completed' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.date.$lte = e;
      }
    }

    const bills = await Bill.find(query).sort({ date: 1 }).lean();

    let totalSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const timelineMap = new Map();

    for (const b of bills) {
      totalSales += b.grandTotal;
      totalDiscount += b.totalDiscount;
      totalTax += b.totalTax;
      totalPaid += b.paidAmount;
      totalDue += b.balanceDue;

      const d = new Date(b.date);
      let key = d.toISOString().split('T')[0];
      if (groupBy === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!timelineMap.has(key)) {
        timelineMap.set(key, { date: key, sales: 0, billsCount: 0 });
      }
      const entry = timelineMap.get(key);
      entry.sales += b.grandTotal;
      entry.billsCount += 1;
    }

    const timeline = Array.from(timelineMap.values()).map((t) => ({
      ...t,
      sales: Math.round(t.sales * 100) / 100
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales: Math.round(totalSales * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalDue: Math.round(totalDue * 100) / 100,
          totalBills: bills.length
        },
        timeline
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Category & Product Wise Performance
 */
export const getCategorySalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { status: 'completed' };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        matchStage.date.$lte = e;
      }
    }

    const result = await Bill.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalRevenue: { $sum: '$items.totalAmount' },
          totalQuantity: { $sum: '$items.quantity' },
          itemsSold: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const formatted = result.map((r) => ({
      category: r._id || 'Other',
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
      totalQuantity: r.totalQuantity,
      itemsSold: r.itemsSold
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GST Filing Report (Taxable, CGST, SGST, IGST)
 */
export const getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { status: 'completed' };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        matchStage.date.$lte = e;
      }
    }

    const bills = await Bill.find(matchStage).select(
      'invoiceNumber date customer taxableAmount cgstAmount sgstAmount igstAmount totalTax grandTotal'
    );

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;

    const formattedBills = bills.map((b) => {
      totalTaxable += b.taxableAmount;
      totalCgst += b.cgstAmount;
      totalSgst += b.sgstAmount;
      totalIgst += b.igstAmount;
      totalTax += b.totalTax;

      return {
        invoiceNumber: b.invoiceNumber,
        date: b.date,
        customerName: b.customer?.name,
        customerGstin: b.customer?.gstin || 'Unregistered',
        taxableAmount: b.taxableAmount,
        cgst: b.cgstAmount,
        sgst: b.sgstAmount,
        igst: b.igstAmount,
        totalTax: b.totalTax,
        invoiceTotal: b.grandTotal
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTaxable: Math.round(totalTaxable * 100) / 100,
          totalCgst: Math.round(totalCgst * 100) / 100,
          totalSgst: Math.round(totalSgst * 100) / 100,
          totalIgst: Math.round(totalIgst * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100
        },
        bills: formattedBills
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Profit Report (Selling Price - Purchase Price) (Admin strictly only)
 */
export const getProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { status: 'completed' };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        matchStage.date.$lte = e;
      }
    }

    const bills = await Bill.find(matchStage).select('items date invoiceNumber grandTotal');

    let totalRevenue = 0;
    let totalCost = 0;

    for (const b of bills) {
      for (const it of b.items) {
        const cost = (it.purchasePrice || 0) * it.quantity;
        const revenue = it.taxableAmount; // Profit calculated before tax
        totalCost += cost;
        totalRevenue += revenue;
      }
    }

    const grossProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
    const profitMargin =
      totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        grossProfit,
        profitMargin
      }
    });
  } catch (err) {
    next(err);
  }
};
