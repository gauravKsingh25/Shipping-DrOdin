const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const statewiseChargesSchema = new Schema({
  providerId: { type: Number, required: true },
  providerName: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  perKiloFee: { type: Number, required: true },
  fuelSurcharge: { type: Number, required: true }
}, {
  timestamps: true,
});

// Create compound index for efficient queries
statewiseChargesSchema.index({ providerId: 1, state: 1 });

const StatewiseCharges = mongoose.model('StatewiseCharges', statewiseChargesSchema);

module.exports = StatewiseCharges;
