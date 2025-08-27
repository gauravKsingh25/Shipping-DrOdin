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

// Auto-assign providerId and providerName from existing providers
statewiseChargesSchema.pre('save', async function(next) {
  if (this.isNew && (!this.providerId || !this.providerName)) {
    try {
      const Provider = require('./provider.model');
      
      if (this.providerId && !this.providerName) {
        // If providerId is provided but providerName is missing, fetch it
        const provider = await Provider.findOne({ providerId: this.providerId });
        if (provider) {
          this.providerName = provider.providerName;
        }
      } else if (!this.providerId) {
        // If no providerId provided, assign the next available one
        const lastStateCharge = await this.constructor.findOne().sort({ providerId: -1 });
        const nextProviderId = lastStateCharge ? lastStateCharge.providerId + 1 : 1;
        
        // Try to find existing provider or create reference
        const provider = await Provider.findOne({ providerId: nextProviderId });
        if (provider) {
          this.providerId = provider.providerId;
          this.providerName = provider.providerName;
        } else {
          this.providerId = nextProviderId;
          this.providerName = this.providerName || `Provider ${nextProviderId}`;
        }
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Create compound index for efficient queries
statewiseChargesSchema.index({ providerId: 1, state: 1 });

const StatewiseCharges = mongoose.model('StatewiseCharges', statewiseChargesSchema);

module.exports = StatewiseCharges;
