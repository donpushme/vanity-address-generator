import mongoose from 'mongoose';

const vanityAddressSchema = new mongoose.Schema({
  publicKey: {
    type: String,
    required: true,
    unique: true,
  },
  privateKey: {
    type: String,
    required: true,
  },
  pattern: {
    prefix: String,
    suffix: String,
    contains: String,
    caseSensitive: Boolean,
  },
  attempts: {
    type: Number,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  }
});

export const VanityAddress = mongoose.model('VanityAddress', vanityAddressSchema); 