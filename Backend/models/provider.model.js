const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const providerSchema = new Schema({
  providerId: { type: Number, unique: true },
  providerName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
});

// Auto-increment providerId before saving
providerSchema.pre('save', async function(next) {
  if (this.isNew && !this.providerId) {
    try {
      const lastProvider = await this.constructor.findOne().sort({ providerId: -1 });
      this.providerId = lastProvider ? lastProvider.providerId + 1 : 1;
    } catch (error) {
      next(error);
    }
  }
  next();
});

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
