const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const fixedChargesSchema = new Schema({
  providerId: { type: Number, required: true, unique: true },
  docketCharge: { type: Number, required: true },
  codCharge: { type: Number, required: true },
  holidayCharge: { type: Number, required: true },
  outstationCharge: { type: Number, required: true },
  insuranceChargePercent: { type: Number, required: true },
  ngtGreenTax: { type: Number, required: true },
  keralaHandlingCharge: { type: Number, required: true }
}, {
  timestamps: true,
});

// Auto-assign providerId from existing providers or auto-increment
fixedChargesSchema.pre('save', async function(next) {
  if (this.isNew && !this.providerId) {
    try {
      const Provider = require('./provider.model');
      
      // Try to find an existing provider that doesn't have fixed charges
      const existingProviders = await Provider.find({}).sort({ providerId: 1 });
      const existingFixedCharges = await this.constructor.find({}).sort({ providerId: 1 });
      const usedProviderIds = existingFixedCharges.map(fc => fc.providerId);
      
      // Find the first provider without fixed charges
      const availableProvider = existingProviders.find(p => !usedProviderIds.includes(p.providerId));
      
      if (availableProvider) {
        this.providerId = availableProvider.providerId;
      } else {
        // If no available provider, get the next available ID
        const lastFixed = await this.constructor.findOne().sort({ providerId: -1 });
        this.providerId = lastFixed ? lastFixed.providerId + 1 : 1;
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

const FixedCharges = mongoose.model('FixedCharges', fixedChargesSchema);

module.exports = FixedCharges;
