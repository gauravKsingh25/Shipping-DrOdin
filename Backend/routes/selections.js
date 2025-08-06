const express = require('express');
const Selection = require('../models/selection.model.js');

const router = express.Router();

// Get all selections
router.get('/', async (req, res) => {
  try {
    const selections = await Selection.find({}).sort({ createdAt: -1 });
    res.json(selections);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get selections by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const selections = await Selection.find(query).sort({ date: -1 });
    res.json(selections);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new selection
router.post('/', async (req, res) => {
  try {
    const { vendorName, providerName, total, date } = req.body;
    
    const newSelection = new Selection({
      vendorName,
      providerName,
      total,
      date: new Date(date)
    });
    
    const savedSelection = await newSelection.save();
    res.status(201).json({ success: true, data: savedSelection });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;