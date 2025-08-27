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

// Create new provider
router.post('/', async (req, res) => {
  try {
    const { providerId, providerName, description, isActive } = req.body;
    
    // If providerId is provided, check if it already exists
    if (providerId) {
      const existingProvider = await Provider.findOne({ providerId });
      if (existingProvider) {
        return res.status(400).json({ success: false, error: 'Provider ID already exists' });
      }
    }
    
    const newProvider = new Provider({
      ...(providerId && { providerId }),
      providerName,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });
    
    const savedProvider = await newProvider.save();
    res.status(201).json({ success: true, data: savedProvider });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  try {
    const { providerName, description, isActive } = req.body;
    
    const updatedProvider = await Provider.findOneAndUpdate(
      { providerId: req.params.id },
      {
        ...(providerName && { providerName }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedProvider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    res.json({ success: true, data: updatedProvider });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete provider
router.delete('/:id', async (req, res) => {
  try {
    const deletedProvider = await Provider.findOneAndDelete({ providerId: req.params.id });
    
    if (!deletedProvider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update providers (replace all)
router.post('/bulk-update', async (req, res) => {
  try {
    const { providers } = req.body;
    
    if (!Array.isArray(providers)) {
      return res.status(400).json({ success: false, error: 'Providers must be an array' });
    }
    
    // Clear existing providers and insert new ones
    await Provider.deleteMany({});
    
    const insertedProviders = await Provider.insertMany(providers.map(p => ({
      providerId: p['Provider ID'],
      providerName: p['Provider Name'],
      description: p.description || '',
      isActive: p.isActive !== undefined ? p.isActive : true
    })));
    
    res.json({ success: true, data: insertedProviders, count: insertedProviders.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Single row update for Advanced Settings
router.put('/update-row/:id', async (req, res) => {
  try {
    const { providerName, description, isActive } = req.body;
    
    const updatedProvider = await Provider.findOneAndUpdate(
      { providerId: req.params.id },
      {
        ...(providerName && { providerName }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedProvider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    res.json({ success: true, data: updatedProvider });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create new row for Advanced Settings
router.post('/create-row', async (req, res) => {
  try {
    const { providerId, providerName, description, isActive } = req.body;
    
    // If providerId is provided, check if it already exists
    if (providerId) {
      const existingProvider = await Provider.findOne({ providerId });
      if (existingProvider) {
        return res.status(400).json({ success: false, error: 'Provider ID already exists' });
      }
    }
    
    const newProvider = new Provider({
      ...(providerId && { providerId }),
      providerName,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });
    
    const savedProvider = await newProvider.save();
    res.status(201).json({ success: true, data: savedProvider });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete row for Advanced Settings
router.delete('/delete-row/:id', async (req, res) => {
  try {
    const deletedProvider = await Provider.findOneAndDelete({ providerId: req.params.id });
    
    if (!deletedProvider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
