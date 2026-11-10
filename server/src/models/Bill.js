import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  brand: { type: String, default: '' },
  sizeModel: { type: String, default: '' },
  unit: { type: String, default: 'piece' },
  hsnCode: { type: String, default: '' },
  quantity: { type: Number, required: true, min: [0.01, 'Quantity must be positive'] },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  discountType: { type: String, enum: ['percentage', 'amount'], default: 'amount' },
  discountValue: { type: Number, default: 0, min: 0 },
  itemDiscountAmount: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 18, min: 0 },
  taxableAmount: { type: Number, required: true, min: 0 },
  cgstAmount: { type: Number, default: 0, min: 0 },
  sgstAmount: { type: Number, default: 0, min: 0 },
  igstAmount: { type: Number, default: 0, min: 0 },
  totalTax: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 }
});

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    customer: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
      },
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true, index: true },
      address: { type: String, default: '', trim: true },
      gstin: { type: String, default: '', trim: true, uppercase: true }
    },
    items: [billItemSchema],
    isInterState: {
      type: Boolean,
      default: false
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    igstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0
    },
    roundOff: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Credit', 'Partial'],
      default: 'Cash',
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'paid',
      index: true
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'returned'],
      default: 'completed',
      index: true
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: {
      type: Date
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
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff'
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

billSchema.index({ date: -1, status: 1 });
billSchema.index({ 'customer.phone': 1, date: -1 });

export const Bill = mongoose.model('Bill', billSchema);
