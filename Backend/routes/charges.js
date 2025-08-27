const express = require('express');
const StatewiseCharges = require('../models/statewiseCharges.model.js');
const FixedCharges = require('../models/fixedCharges.model.js');

const router = express.Router();

// Get all statewise charges
router.get('/statewise', async (req, res) => {
  try {
    const charges = await StatewiseCharges.find({}).sort({ providerId: 1, state: 1 });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statewise charges by state
router.get('/statewise/:state', async (req, res) => {
  try {
    const charges = await StatewiseCharges.find({ 
      state: new RegExp(req.params.state, 'i') 
    }).sort({ providerId: 1 });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new statewise charge
router.post('/statewise', async (req, res) => {
  try {
    const { providerId, providerName, state, perKiloFee, fuelSurcharge } = req.body;
    
    const newCharge = new StatewiseCharges({
      ...(providerId && { providerId }),
      ...(providerName && { providerName }),
      state,
      perKiloFee,
      fuelSurcharge
    });
    
    const savedCharge = await newCharge.save();
    res.status(201).json({ success: true, data: savedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update statewise charge
router.put('/statewise/:id', async (req, res) => {
  try {
    const { perKiloFee, fuelSurcharge } = req.body;
    
    const updatedCharge = await StatewiseCharges.findByIdAndUpdate(
      req.params.id,
      {
        ...(perKiloFee !== undefined && { perKiloFee }),
        ...(fuelSurcharge !== undefined && { fuelSurcharge })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCharge) {
      return res.status(404).json({ success: false, error: 'Statewise charge not found' });
    }
    
    res.json({ success: true, data: updatedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete statewise charge
router.delete('/statewise/:id', async (req, res) => {
  try {
    const deletedCharge = await StatewiseCharges.findByIdAndDelete(req.params.id);
    
    if (!deletedCharge) {
      return res.status(404).json({ success: false, error: 'Statewise charge not found' });
    }
    
    res.json({ success: true, message: 'Statewise charge deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update statewise charges (replace all)
router.post('/statewise/bulk-update', async (req, res) => {
  try {
    const { charges } = req.body;
    
    if (!Array.isArray(charges)) {
      return res.status(400).json({ success: false, error: 'Charges must be an array' });
    }
    
    // Clear existing charges and insert new ones
    await StatewiseCharges.deleteMany({});
    
    const insertedCharges = await StatewiseCharges.insertMany(charges.map(c => ({
      providerId: c['Provider ID'],
      providerName: c['Provider Name'],
      state: c['State'],
      perKiloFee: c['Per Kilo Fee (INR)'],
      fuelSurcharge: c['Fuel Surcharge (%)']
    })));
    
    res.json({ success: true, data: insertedCharges, count: insertedCharges.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Single row update for statewise charges
router.put('/statewise/update-row/:id', async (req, res) => {
  try {
    const { perKiloFee, fuelSurcharge } = req.body;
    
    const updatedCharge = await StatewiseCharges.findByIdAndUpdate(
      req.params.id,
      {
        ...(perKiloFee !== undefined && { perKiloFee }),
        ...(fuelSurcharge !== undefined && { fuelSurcharge })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCharge) {
      return res.status(404).json({ success: false, error: 'Statewise charge not found' });
    }
    
    res.json({ success: true, data: updatedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create new row for statewise charges
router.post('/statewise/create-row', async (req, res) => {
  try {
    const { providerId, providerName, state, perKiloFee, fuelSurcharge } = req.body;
    
    const newCharge = new StatewiseCharges({
      ...(providerId && { providerId }),
      ...(providerName && { providerName }),
      state,
      perKiloFee,
      fuelSurcharge
    });
    
    const savedCharge = await newCharge.save();
    res.status(201).json({ success: true, data: savedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete row for statewise charges
router.delete('/statewise/delete-row/:id', async (req, res) => {
  try {
    const deletedCharge = await StatewiseCharges.findByIdAndDelete(req.params.id);
    
    if (!deletedCharge) {
      return res.status(404).json({ success: false, error: 'Statewise charge not found' });
    }
    
    res.json({ success: true, message: 'Statewise charge deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all fixed charges
router.get('/fixed', async (req, res) => {
  try {
    const charges = await FixedCharges.find({}).sort({ providerId: 1 });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get fixed charges by provider ID
router.get('/fixed/:providerId', async (req, res) => {
  try {
    const charges = await FixedCharges.findOne({ 
      providerId: parseInt(req.params.providerId) 
    });
    if (!charges) {
      return res.status(404).json({ success: false, error: 'Fixed charges not found for this provider' });
    }
    res.json(charges);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new fixed charge
router.post('/fixed', async (req, res) => {
  try {
    const { 
      providerId, 
      docketCharge, 
      codCharge, 
      holidayCharge, 
      outstationCharge,
      insuranceChargePercent,
      ngtGreenTax,
      keralaHandlingCharge
    } = req.body;
    
    // Check if fixed charges already exist for this provider (only if providerId is specified)
    if (providerId) {
      const existingCharge = await FixedCharges.findOne({ providerId });
      if (existingCharge) {
        return res.status(400).json({ success: false, error: 'Fixed charges already exist for this provider' });
      }
    }
    
    const newCharge = new FixedCharges({
      ...(providerId && { providerId }),
      docketCharge,
      codCharge,
      holidayCharge,
      outstationCharge,
      insuranceChargePercent,
      ngtGreenTax,
      keralaHandlingCharge
    });
    
    const savedCharge = await newCharge.save();
    res.status(201).json({ success: true, data: savedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update fixed charge
router.put('/fixed/:providerId', async (req, res) => {
  try {
    const { 
      docketCharge, 
      codCharge, 
      holidayCharge, 
      outstationCharge,
      insuranceChargePercent,
      ngtGreenTax,
      keralaHandlingCharge
    } = req.body;
    
    const updatedCharge = await FixedCharges.findOneAndUpdate(
      { providerId: req.params.providerId },
      {
        ...(docketCharge !== undefined && { docketCharge }),
        ...(codCharge !== undefined && { codCharge }),
        ...(holidayCharge !== undefined && { holidayCharge }),
        ...(outstationCharge !== undefined && { outstationCharge }),
        ...(insuranceChargePercent !== undefined && { insuranceChargePercent }),
        ...(ngtGreenTax !== undefined && { ngtGreenTax }),
        ...(keralaHandlingCharge !== undefined && { keralaHandlingCharge })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCharge) {
      return res.status(404).json({ success: false, error: 'Fixed charge not found' });
    }
    
    res.json({ success: true, data: updatedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete fixed charge
router.delete('/fixed/:providerId', async (req, res) => {
  try {
    const deletedCharge = await FixedCharges.findOneAndDelete({ providerId: req.params.providerId });
    
    if (!deletedCharge) {
      return res.status(404).json({ success: false, error: 'Fixed charge not found' });
    }
    
    res.json({ success: true, message: 'Fixed charge deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update fixed charges (replace all)
router.post('/fixed/bulk-update', async (req, res) => {
  try {
    const { charges } = req.body;
    
    if (!Array.isArray(charges)) {
      return res.status(400).json({ success: false, error: 'Charges must be an array' });
    }
    
    // Clear existing charges and insert new ones
    await FixedCharges.deleteMany({});
    
    const insertedCharges = await FixedCharges.insertMany(charges.map(c => ({
      providerId: c['Provider ID'],
      docketCharge: c['Docket Charge (INR)'],
      codCharge: c['COD Charge (INR)'],
      holidayCharge: c['Holiday Charge (INR)'],
      outstationCharge: c['Outstation Charge (INR)'],
      insuranceChargePercent: c['Insurance Charge (%)'],
      ngtGreenTax: c['NGT Green Tax (INR)'],
      keralaHandlingCharge: c['Kerala North East Handling Charge (INR)']
    })));
    
    res.json({ success: true, data: insertedCharges, count: insertedCharges.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Single row update for fixed charges
router.put('/fixed/update-row/:providerId', async (req, res) => {
  try {
    const { 
      docketCharge, 
      codCharge, 
      holidayCharge, 
      outstationCharge,
      insuranceChargePercent,
      ngtGreenTax,
      keralaHandlingCharge
    } = req.body;
    
    const updatedCharge = await FixedCharges.findOneAndUpdate(
      { providerId: req.params.providerId },
      {
        ...(docketCharge !== undefined && { docketCharge }),
        ...(codCharge !== undefined && { codCharge }),
        ...(holidayCharge !== undefined && { holidayCharge }),
        ...(outstationCharge !== undefined && { outstationCharge }),
        ...(insuranceChargePercent !== undefined && { insuranceChargePercent }),
        ...(ngtGreenTax !== undefined && { ngtGreenTax }),
        ...(keralaHandlingCharge !== undefined && { keralaHandlingCharge })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCharge) {
      return res.status(404).json({ success: false, error: 'Fixed charge not found' });
    }
    
    res.json({ success: true, data: updatedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create new row for fixed charges
router.post('/fixed/create-row', async (req, res) => {
  try {
    const { 
      providerId, 
      docketCharge, 
      codCharge, 
      holidayCharge, 
      outstationCharge,
      insuranceChargePercent,
      ngtGreenTax,
      keralaHandlingCharge
    } = req.body;
    
    // Check if fixed charges already exist for this provider (only if providerId is specified)
    if (providerId) {
      const existingCharge = await FixedCharges.findOne({ providerId });
      if (existingCharge) {
        return res.status(400).json({ success: false, error: 'Fixed charges already exist for this provider' });
      }
    }
    
    const newCharge = new FixedCharges({
      ...(providerId && { providerId }),
      docketCharge,
      codCharge,
      holidayCharge,
      outstationCharge,
      insuranceChargePercent,
      ngtGreenTax,
      keralaHandlingCharge
    });
    
    const savedCharge = await newCharge.save();
    res.status(201).json({ success: true, data: savedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete row for fixed charges
router.delete('/fixed/delete-row/:providerId', async (req, res) => {
  try {
    const deletedCharge = await FixedCharges.findOneAndDelete({ providerId: req.params.providerId });
    
    if (!deletedCharge) {
      return res.status(404).json({ success: false, error: 'Fixed charge not found' });
    }
    
    res.json({ success: true, message: 'Fixed charge deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
