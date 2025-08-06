const Provider = require('../models/provider.model.js');
const FixedCharges = require('../models/fixedCharges.model.js');
const StatewiseCharges = require('../models/statewiseCharges.model.js');
const fs = require('fs');
const path = require('path');

// Function to load JSON data files
const loadJSONData = (filename) => {
  try {
    const filePath = path.join(__dirname, '../../shipping-dashboard', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return null;
  }
};

// Real providers data from JSON
const providersData = [
  { providerId: 1, providerName: "DTDC", description: "Status: recd", isActive: true },
  { providerId: 2, providerName: "Blue Dart", description: "Status: recd", isActive: true },
  { providerId: 3, providerName: "DP World", description: "Status: recd", isActive: true },
  { providerId: 4, providerName: "Professional", description: "Status: Awaited", isActive: false },
  { providerId: 5, providerName: "Safe Express", description: "Status: recd", isActive: true },
  { providerId: 6, providerName: "TCI Express", description: "Status: recd", isActive: true },
  { providerId: 7, providerName: "Trackon", description: "Status: recd", isActive: true },
  { providerId: 8, providerName: "Vision", description: "Status: recd", isActive: true },
  { providerId: 9, providerName: "On Dot", description: "Status: Awaited", isActive: false },
  { providerId: 10, providerName: "Gati", description: "Status: recd", isActive: true }
];

// Real fixed charges data from JSON
const fixedChargesData = [
  {
    providerId: 1,
    docketCharge: 48,
    codCharge: 49,
    holidayCharge: 24,
    outstationCharge: 47,
    insuranceChargePercent: 2.5,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 2,
    docketCharge: 38,
    codCharge: 45,
    holidayCharge: 24,
    outstationCharge: 45,
    insuranceChargePercent: 2.0,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 3,
    docketCharge: 50,
    codCharge: 100,
    holidayCharge: 150,
    outstationCharge: 0,
    insuranceChargePercent: 3.0,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 4,
    docketCharge: 26,
    codCharge: 43,
    holidayCharge: 27,
    outstationCharge: 49,
    insuranceChargePercent: 2.2,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 5,
    docketCharge: 43,
    codCharge: 44,
    holidayCharge: 22,
    outstationCharge: 31,
    insuranceChargePercent: 2.8,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 6,
    docketCharge: 49,
    codCharge: 59,
    holidayCharge: 15,
    outstationCharge: 40,
    insuranceChargePercent: 2.1,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 7,
    docketCharge: 33,
    codCharge: 51,
    holidayCharge: 30,
    outstationCharge: 30,
    insuranceChargePercent: 2.4,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 8,
    docketCharge: 35,
    codCharge: 53,
    holidayCharge: 29,
    outstationCharge: 46,
    insuranceChargePercent: 2.6,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 9,
    docketCharge: 49,
    codCharge: 49,
    holidayCharge: 21,
    outstationCharge: 49,
    insuranceChargePercent: 2.3,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  },
  {
    providerId: 10,
    docketCharge: 48,
    codCharge: 44,
    holidayCharge: 28,
    outstationCharge: 44,
    insuranceChargePercent: 2.7,
    ngtGreenTax: 5,
    keralaHandlingCharge: 15
  }
];

// Sample statewise charges data (subset - the migration script will load all)
const statewiseChargesData = [
  {
    providerId: 1,
    providerName: "DTDC",
    state: "Maharashtra",
    perKiloFee: 23.0,
    fuelSurcharge: 9
  },
  {
    providerId: 1,
    providerName: "DTDC",
    state: "Karnataka",
    perKiloFee: 28.0,
    fuelSurcharge: 10
  },
  {
    providerId: 2,
    providerName: "Blue Dart",
    state: "Maharashtra",
    perKiloFee: 39.0,
    fuelSurcharge: 8
  },
  {
    providerId: 2,
    providerName: "Blue Dart",
    state: "Karnataka",
    perKiloFee: 24.0,
    fuelSurcharge: 15
  }
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Load JSON data
    const providersJSON = loadJSONData('Providers.json');
    const fixedChargesJSON = loadJSONData('Fixed_Charges.json');
    const statewiseChargesJSON = loadJSONData('Statewise_Charges.json');

    if (!providersJSON || !fixedChargesJSON || !statewiseChargesJSON) {
      console.error('Failed to load JSON data files. Using default data.');
      return seedWithDefaultData();
    }

    // Clear existing data
    await Provider.deleteMany({});
    await FixedCharges.deleteMany({});
    await StatewiseCharges.deleteMany({});
    console.log('Cleared existing collections');

    // Transform and seed providers
    const transformedProviders = providersJSON.map(item => ({
      providerId: item["Provider ID"],
      providerName: item["Provider Name"],
      description: `Status: ${item["Unnamed: 2"] || 'Unknown'}`,
      isActive: item["Unnamed: 2"] === 'recd'
    }));
    await Provider.insertMany(transformedProviders);
    console.log(`Seeded ${transformedProviders.length} providers`);

    // Transform and seed fixed charges
    const transformedFixedCharges = fixedChargesJSON.map(item => ({
      providerId: item["Provider ID"],
      docketCharge: item["Docket Charge (INR)"],
      codCharge: item["COD Charge (INR)"],
      holidayCharge: item["Holiday Charge (INR)"],
      outstationCharge: item["Outstation Charge (INR)"],
      insuranceChargePercent: item["Insurance Charge (%)"],
      ngtGreenTax: item["NGT Green Tax (INR)"],
      keralaHandlingCharge: item["Kerala North East Handling Charge (INR)"]
    }));
    await FixedCharges.insertMany(transformedFixedCharges);
    console.log(`Seeded ${transformedFixedCharges.length} fixed charges`);

    // Create provider lookup for statewise charges
    const providerLookup = {};
    providersJSON.forEach(provider => {
      providerLookup[provider["Provider ID"]] = provider["Provider Name"];
    });

    // Transform and seed statewise charges in batches
    const transformedStatewiseCharges = statewiseChargesJSON.map(item => ({
      providerId: item["Provider ID"],
      providerName: providerLookup[item["Provider ID"]] || `Provider ${item["Provider ID"]}`,
      state: item["State"],
      perKiloFee: parseFloat(item["Per Kilo Fee (INR)"]),
      fuelSurcharge: item["Fuel Surcharge (%)"]
    }));

    // Insert statewise charges in batches to avoid memory issues
    const batchSize = 500;
    let totalInserted = 0;
    for (let i = 0; i < transformedStatewiseCharges.length; i += batchSize) {
      const batch = transformedStatewiseCharges.slice(i, i + batchSize);
      await StatewiseCharges.insertMany(batch);
      totalInserted += batch.length;
      console.log(`Inserted batch: ${totalInserted}/${transformedStatewiseCharges.length} statewise charges`);
    }

    console.log('Database seeding completed successfully!');
    console.log(`Total records: ${transformedProviders.length + transformedFixedCharges.length + transformedStatewiseCharges.length}`);
  } catch (error) {
    console.error('Error seeding database:', error);
    console.log('Falling back to default data...');
    await seedWithDefaultData();
  }
};

const seedWithDefaultData = async () => {
  try {
    // Clear existing data
    await Provider.deleteMany({});
    await FixedCharges.deleteMany({});
    await StatewiseCharges.deleteMany({});

    // Seed providers
    await Provider.insertMany(providersData);
    console.log('Providers seeded successfully (default data)');

    // Seed fixed charges
    await FixedCharges.insertMany(fixedChargesData);
    console.log('Fixed charges seeded successfully (default data)');

    // Seed sample statewise charges
    await StatewiseCharges.insertMany(statewiseChargesData);
    console.log('Statewise charges seeded successfully (default data)');

    console.log('Database seeding completed with default data!');
  } catch (error) {
    console.error('Error seeding with default data:', error);
    throw error;
  }
};

module.exports = { seedDatabase };
