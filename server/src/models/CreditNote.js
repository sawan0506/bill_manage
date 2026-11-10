import mongoose from 'mongoose';

const creditNoteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  reason: { type: String, default: 'Defective or Wrong Size' }
});

const creditNoteSchema = new mongoose.Schema(
  {
    creditNoteNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    originalBill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true
    },
    originalInvoiceNumber: {
      type: String,
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    customerName: {
      type: String,
      required: true
    },
    items: [creditNoteItemSchema],
    totalRefundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    refundMode: {
      type: String,
      enum: ['Cash', 'Credit Adjustment', 'UPI'],
      default: 'Credit Adjustment',
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByName: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const CreditNote = mongoose.model('CreditNote', creditNoteSchema);
