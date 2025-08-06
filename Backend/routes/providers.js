const express = require('express');
const Provider = require('../models/provider.model.js');

const router = express.Router();

// Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = await Provider.find({ isActive: true }).sort({ providerId: 1 });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get provider by ID
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findOne({ providerId: req.params.id });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
