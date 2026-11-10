import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    productName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'CANCEL'],
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    referenceType: {
      type: String,
      enum: ['Bill', 'CreditNote', 'ManualAdjustment', 'Purchase', 'Seed'],
      default: 'ManualAdjustment'
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    referenceNumber: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedByName: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
