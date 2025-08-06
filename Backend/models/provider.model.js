const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const providerSchema = new Schema({
  providerId: { type: Number, required: true, unique: true },
  providerName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
});

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
