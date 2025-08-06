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

module.exports = router;
