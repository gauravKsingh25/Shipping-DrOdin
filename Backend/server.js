const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chalk = require('chalk');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS - use environment variables
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.0.165:3000',
      'https://shipping-drodin.onrender.com',
      'https://endearing-pudding-3d7b9d.netlify.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, allow all localhost origins
      if (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

const uri = process.env.ATLAS_URI;

// Connect to MongoDB
mongoose.connect(uri)
  .then(() => {
    console.log(chalk.green.bold("MongoDB database connection established successfully"));
  })
  .catch((error) => {
    console.error(chalk.red.bold("MongoDB connection error:"), error);
    process.exit(1);
  });

const selectionsRouter = require('./routes/selections.js');
const providersRouter = require('./routes/providers.js');
const chargesRouter = require('./routes/charges.js');
const { seedDatabase } = require('./utils/seedData.js');
const { reindexDatabase } = require('./utils/reindexDatabase.js');

app.use('/api/selections', selectionsRouter);
app.use('/api/providers', providersRouter);
app.use('/api/charges', chargesRouter);

// Add seeding endpoint for development
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add reindexing endpoint for database cleanup
app.post('/api/reindex', async (req, res) => {
  try {
    const result = await reindexDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!', status: 'running' });
  console.log(chalk.cyan('GET / called'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(chalk.red('Error:'), error);
  res.status(500).json({ success: false, error: error.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('Shutting down gracefully...'));
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(port, () => {
    console.log(chalk.magenta.bold(`🚀 Server is running on port: ${port}`));
    console.log(chalk.blue.bold(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`));
    console.log(chalk.blue.bold(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`));
    console.log(chalk.green.bold(`📍 Server URL: http://localhost:${port}`));
});