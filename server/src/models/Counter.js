import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'invoice', 'receipt', 'credit_note'
  seq: { type: Number, default: 0 }
});

export const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increments and gets the next sequence number formatted
 * @param {string} counterName - e.g. 'invoice'
 * @param {string} prefix - e.g. 'INV'
 * @param {number} padLength - e.g. 5
 * @returns {Promise<string>} e.g. 'INV-2026-00001'
 */
export const getNextSequence = async (counterName, prefix = 'INV', padLength = 5) => {
  const currentYear = new Date().getFullYear();
  const fullPrefix = `${prefix}-${currentYear}-`;

  const counter = await Counter.findByIdAndUpdate(
    counterName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(padLength, '0');
  return `${fullPrefix}${seqStr}`;
};
