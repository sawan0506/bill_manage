import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'Kisan Hardware & Sanitary Mart',
      trim: true
    },
    tagline: {
      type: String,
      default: 'Complete Range of Pipes, Motors, Submersibles & Fittings',
      trim: true
    },
    address: {
      type: String,
      default: 'Main Market Road, Near Gandhi Chowk',
      trim: true
    },
    phone: {
      type: String,
      default: '9876543210',
      trim: true
    },
    email: {
      type: String,
      default: 'contact@kisantraders.in',
      trim: true
    },
    gstin: {
      type: String,
      default: '07AAAAA0000A1Z5',
      trim: true,
      uppercase: true
    },
    state: {
      type: String,
      default: 'Delhi',
      trim: true
    },
    stateCode: {
      type: String,
      default: '07',
      trim: true
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
      trim: true,
      uppercase: true
    },
    enableGst: {
      type: Boolean,
      default: true
    },
    defaultGstRate: {
      type: Number,
      default: 18
    },
    termsAndConditions: {
      type: String,
      default: '1. Goods once sold will be exchanged within 7 days with original bill.\n2. Warranty of motors and pumps is provided by the manufacturer directly.\n3. All disputes subject to local jurisdiction.'
    },
    bankName: {
      type: String,
      default: 'State Bank of India',
      trim: true
    },
    bankAccountNumber: {
      type: String,
      default: '123456789012',
      trim: true
    },
    ifscCode: {
      type: String,
      default: 'SBIN0001234',
      trim: true,
      uppercase: true
    },
    upiId: {
      type: String,
      default: 'kisantraders@upi',
      trim: true
    },
    currencySymbol: {
      type: String,
      default: '₹'
    }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
