import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    customerName: {
      type: String,
      default: ''
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be positive']
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
      default: 'Cash',
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    transactionRef: {
      type: String,
      default: '',
      trim: true
    },
    customerPreviousBalance: {
      type: Number,
      default: 0
    },
    customerNewBalance: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receivedByName: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
