const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Import models
const Provider = require('../models/provider.model.js');
const FixedCharges = require('../models/fixedCharges.model.js');
const StatewiseCharges = require('../models/statewiseCharges.model.js');

// MongoDB connection
const uri = process.env.ATLAS_URI;

async function connectToDatabase() {
  try {
    await mongoose.connect(uri);
    console.log(chalk.green.bold("MongoDB database connection established successfully"));
  } catch (error) {
    console.error(chalk.red.bold("MongoDB connection error:"), error);
    process.exit(1);
  }
}

function readJsonFile(fileName) {
  try {
    const filePath = path.join(__dirname, '../../shipping-dashboard', fileName);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red(`Error reading ${fileName}:`), error);
    return null;
  }
}

async function migrateProviders() {
  console.log(chalk.blue('Migrating Providers...'));
  
  const providersData = readJsonFile('Providers.json');
  if (!providersData) return;

  // Clear existing providers
  await Provider.deleteMany({});
  
  const providers = providersData.map(provider => ({
    providerId: provider["Provider ID"],
    providerName: provider["Provider Name"],
    description: `Status: ${provider["Unnamed: 2"]}`,
    isActive: provider["Unnamed: 2"] === "recd"
  }));

  await Provider.insertMany(providers);
  console.log(chalk.green(`✓ Migrated ${providers.length} providers`));
}

async function migrateFixedCharges() {
  console.log(chalk.blue('Migrating Fixed Charges...'));
  
  const fixedChargesData = readJsonFile('Fixed_Charges.json');
  if (!fixedChargesData) return;

  // Clear existing fixed charges
  await FixedCharges.deleteMany({});
  
  const fixedCharges = fixedChargesData.map(charge => ({
    providerId: charge["Provider ID"],
    docketCharge: charge["Docket Charge (INR)"],
    codCharge: charge["COD Charge (INR)"],
    holidayCharge: charge["Holiday Charge (INR)"],
    outstationCharge: charge["Outstation Charge (INR)"],
    insuranceChargePercent: charge["Insurance Charge (%)"],
    ngtGreenTax: charge["NGT Green Tax (INR)"],
    keralaHandlingCharge: charge["Kerala North East Handling Charge (INR)"]
  }));

  await FixedCharges.insertMany(fixedCharges);
  console.log(chalk.green(`✓ Migrated ${fixedCharges.length} fixed charges`));
}

async function migrateStatewiseCharges() {
  console.log(chalk.blue('Migrating Statewise Charges...'));
  
  const statewiseChargesData = readJsonFile('Statewise_Charges.json');
  if (!statewiseChargesData) return;

  // Clear existing statewise charges
  await StatewiseCharges.deleteMany({});
  
  // Get provider names mapping
  const providers = await Provider.find({});
  const providerMap = {};
  providers.forEach(provider => {
    providerMap[provider.providerId] = provider.providerName;
  });

  const statewiseCharges = statewiseChargesData.map(charge => ({
    providerId: charge["Provider ID"],
    providerName: providerMap[charge["Provider ID"]] || `Provider ${charge["Provider ID"]}`,
    state: charge["State"],
    perKiloFee: charge["Per Kilo Fee (INR)"],
    fuelSurcharge: charge["Fuel Surcharge (%)"]
  }));

  await StatewiseCharges.insertMany(statewiseCharges);
  console.log(chalk.green(`✓ Migrated ${statewiseCharges.length} statewise charges`));
}

async function verifyMigration() {
  console.log(chalk.blue('Verifying migration...'));
  
  const providerCount = await Provider.countDocuments();
  const fixedChargesCount = await FixedCharges.countDocuments();
  const statewiseChargesCount = await StatewiseCharges.countDocuments();
  
  console.log(chalk.cyan(`Total Providers: ${providerCount}`));
  console.log(chalk.cyan(`Total Fixed Charges: ${fixedChargesCount}`));
  console.log(chalk.cyan(`Total Statewise Charges: ${statewiseChargesCount}`));

  // Sample data verification
  console.log(chalk.blue('\nSample data verification:'));
  
  const sampleProvider = await Provider.findOne({ providerId: 1 });
  console.log(chalk.cyan('Sample Provider:'), sampleProvider);
  
  const sampleFixedCharge = await FixedCharges.findOne({ providerId: 1 });
  console.log(chalk.cyan('Sample Fixed Charge:'), sampleFixedCharge);
  
  const sampleStatewiseCharge = await StatewiseCharges.findOne({ providerId: 1 });
  console.log(chalk.cyan('Sample Statewise Charge:'), sampleStatewiseCharge);
}

async function main() {
  try {
    console.log(chalk.magenta.bold('🚀 Starting JSON to MongoDB Migration'));
    console.log(chalk.yellow('=' * 50));
    
    await connectToDatabase();
    
    await migrateProviders();
    await migrateFixedCharges();
    await migrateStatewiseCharges();
    
    await verifyMigration();
    
    console.log(chalk.yellow('=' * 50));
    console.log(chalk.green.bold('✅ Migration completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Migration failed:'), error);
  } finally {
    await mongoose.connection.close();
    console.log(chalk.blue('Database connection closed.'));
  }
}

main();
