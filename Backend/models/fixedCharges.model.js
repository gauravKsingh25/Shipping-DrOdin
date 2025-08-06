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

const FixedCharges = mongoose.model('FixedCharges', fixedChargesSchema);

module.exports = FixedCharges;
