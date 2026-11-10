import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateLineItem,
  calculateBillTotals,
  round2
} from '../src/utils/billingCalculator.js';

describe('Hardware Billing Calculation Engine', () => {
  it('should round numbers to 2 decimal places correctly', () => {
    assert.strictEqual(round2(10.555), 10.56);
    assert.strictEqual(round2(10.554), 10.55);
    assert.strictEqual(round2(10), 10);
  });

  it('should calculate single item with flat amount discount and 18% GST', () => {
    // 2 PVC Pipes at ₹350 each = ₹700 gross. Discount ₹50 => Taxable ₹650.
    // 18% GST on ₹650 = ₹117 (CGST ₹58.50, SGST ₹58.50). Total = ₹767.
    const item = {
      quantity: 2,
      sellingPrice: 350,
      purchasePrice: 280,
      discountType: 'amount',
      discountValue: 50,
      taxRate: 18
    };

    const calculated = calculateLineItem(item, false, true);

    assert.strictEqual(calculated.grossAmount, 700);
    assert.strictEqual(calculated.discountAmount, 50);
    assert.strictEqual(calculated.taxableAmount, 650);
    assert.strictEqual(calculated.cgstAmount, 58.5);
    assert.strictEqual(calculated.sgstAmount, 58.5);
    assert.strictEqual(calculated.totalTax, 117);
    assert.strictEqual(calculated.totalAmount, 767);
  });

  it('should calculate percentage discount correctly', () => {
    // 1 Motor at ₹3000, 10% discount = ₹300 discount => Taxable ₹2700.
    // 18% GST on ₹2700 = ₹486. Total = ₹3186.
    const item = {
      quantity: 1,
      sellingPrice: 3000,
      purchasePrice: 2400,
      discountType: 'percentage',
      discountValue: 10,
      taxRate: 18
    };

    const calculated = calculateLineItem(item, false, true);

    assert.strictEqual(calculated.grossAmount, 3000);
    assert.strictEqual(calculated.discountAmount, 300);
    assert.strictEqual(calculated.taxableAmount, 2700);
    assert.strictEqual(calculated.totalTax, 486);
    assert.strictEqual(calculated.totalAmount, 3186);
  });

  it('should route full tax to IGST for interstate billing', () => {
    const item = {
      quantity: 1,
      sellingPrice: 1000,
      purchasePrice: 800,
      discountType: 'amount',
      discountValue: 0,
      taxRate: 18
    };

    const calculated = calculateLineItem(item, true, true);

    assert.strictEqual(calculated.cgstAmount, 0);
    assert.strictEqual(calculated.sgstAmount, 0);
    assert.strictEqual(calculated.igstAmount, 180);
    assert.strictEqual(calculated.totalTax, 180);
    assert.strictEqual(calculated.totalAmount, 1180);
  });

  it('should correctly aggregate multiple items and calculate round-off & balance due', () => {
    const items = [
      {
        quantity: 3,
        sellingPrice: 130.33,
        purchasePrice: 80,
        discountType: 'amount',
        discountValue: 0,
        taxRate: 18
      },
      {
        quantity: 1,
        sellingPrice: 850,
        purchasePrice: 620,
        discountType: 'amount',
        discountValue: 50,
        taxRate: 18
      }
    ];

    const result = calculateBillTotals(items, {
      isInterState: false,
      enableGst: true,
      paidAmount: 500
    });

    assert(result.grandTotal > 0);
    assert.strictEqual(result.paidAmount, 500);
    assert.strictEqual(result.balanceDue, round2(result.grandTotal - 500));
    assert.strictEqual(result.paymentStatus, 'partial');
  });

  it('should mark bill as paid when full amount is paid', () => {
    const items = [
      {
        quantity: 1,
        sellingPrice: 100,
        purchasePrice: 70,
        discountType: 'amount',
        discountValue: 0,
        taxRate: 0
      }
    ];

    const result = calculateBillTotals(items, {
      isInterState: false,
      enableGst: false,
      paidAmount: 100
    });

    assert.strictEqual(result.grandTotal, 100);
    assert.strictEqual(result.paidAmount, 100);
    assert.strictEqual(result.balanceDue, 0);
    assert.strictEqual(result.paymentStatus, 'paid');
  });

  it('should mark bill as unpaid when zero amount is paid (Udhaar)', () => {
    const items = [
      {
        quantity: 2,
        sellingPrice: 500,
        purchasePrice: 350,
        discountType: 'amount',
        discountValue: 0,
        taxRate: 0
      }
    ];

    const result = calculateBillTotals(items, {
      isInterState: false,
      enableGst: false,
      paidAmount: 0
    });

    assert.strictEqual(result.grandTotal, 1000);
    assert.strictEqual(result.paidAmount, 0);
    assert.strictEqual(result.balanceDue, 1000);
    assert.strictEqual(result.paymentStatus, 'unpaid');
  });
});
