import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Selection Schema
const selectionSchema = new mongoose.Schema({
  vendorName: {
    type: String,
    required: true,
    trim: true
  },
  providerName: {
    type: String,
    required: true,
    trim: true
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Selection = mongoose.model('Selection', selectionSchema);

// GET all selections
router.route('/').get(async (req, res) => {
  try {
    const selections = await Selection.find().sort({ createdAt: -1 });
    res.json({ success: true, data: selections });
  } catch (error) {
    console.error('Get selections error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add new selection
router.route('/add').post(async (req, res) => {
  try {
    const { vendorName, providerName, total, date } = req.body;
    
    // Validation
    if (!vendorName || !providerName || !total || !date) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: vendorName, providerName, total, date' 
      });
    }
    
    if (typeof total !== 'number' || total < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Total must be a non-negative number' 
      });
    }
    
    const newSelection = new Selection({
      vendorName: vendorName.trim(),
      providerName: providerName.trim(),
      total: parseFloat(total),
      date: date
    });
    
    const savedSelection = await newSelection.save();
    console.log('Selection saved:', savedSelection);
    
    res.json({ 
      success: true, 
      data: savedSelection,
      message: 'Selection saved successfully' 
    });
  } catch (error) {
    console.error('Add selection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET selections by date range
router.route('/range').get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Export range request:', { startDate, endDate });
    
    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both startDate and endDate are required' 
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dates must be in YYYY-MM-DD format' 
      });
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date cannot be after end date' 
      });
    }
    
    // Build query for date range
    const query = {
      date: { 
        $gte: startDate, 
        $lte: endDate 
      }
    };
    
    console.log('Database query:', query);
    
    const selections = await Selection.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    console.log(`Found ${selections.length} selections for date range`);
    
    // Ensure all required fields are present
    const sanitizedSelections = selections.map(selection => ({
      _id: selection._id,
      vendorName: selection.vendorName || '',
      providerName: selection.providerName || '',
      total: Number(selection.total) || 0,
      date: selection.date || '',
      createdAt: selection.createdAt || selection._id.getTimestamp()
    }));
    
    res.json({ 
      success: true, 
      data: sanitizedSelections,
      count: sanitizedSelections.length,
      query: { startDate, endDate }
    });
    
  } catch (error) {
    console.error('Get selections by range error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// DELETE selection by ID
router.route('/:id').delete(async (req, res) => {
  try {
    const deletedSelection = await Selection.findByIdAndDelete(req.params.id);
    
    if (!deletedSelection) {
      return res.status(404).json({ success: false, error: 'Selection not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Selection deleted successfully',
      data: deletedSelection 
    });
  } catch (error) {
    console.error('Delete selection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;