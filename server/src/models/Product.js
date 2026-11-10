import mongoose from 'mongoose';

export const CATEGORIES = [
  'Pipe',
  'Hand Pump',
  'Tap',
  'Motor',
  'Submersible',
  'Fitting',
  'Other'
];

export const UNITS = ['piece', 'meter', 'set', 'kg', 'packet', 'bundle', 'feet'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
      index: true
    },
    brand: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100
    },
    sizeModel: {
      type: String,
      trim: true,
      default: '', // e.g., '1 inch', '0.5 HP', '100m'
      maxlength: 100
    },
    unit: {
      type: String,
      enum: UNITS,
      default: 'piece',
      required: true
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    gstRate: {
      type: Number,
      default: 18, // 0, 5, 12, 18, 28
      min: 0,
      max: 100
    },
    hsnCode: {
      type: String,
      trim: true,
      default: ''
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockLevel: {
      type: Number,
      default: 5,
      min: 0
    },
    itemCode: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for fast search by name, brand, model, itemCode
productSchema.index({
  name: 'text',
  brand: 'text',
  sizeModel: 'text',
  itemCode: 'text'
});

export const Product = mongoose.model('Product', productSchema);
