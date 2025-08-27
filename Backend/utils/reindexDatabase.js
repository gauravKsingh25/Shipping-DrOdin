const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

/**
 * Reindex and regenerate all database records with sequential IDs
 * This will clean up the database and ensure all IDs are properly sequenced
 */
async function reindexDatabase() {
  try {
    console.log('🔄 Starting database reindexing...');

    // Step 1: Get all existing data
    console.log('📊 Fetching existing data...');
    const existingProviders = await Provider.find({}).sort({ createdAt: 1 });
    const existingFixedCharges = await FixedCharges.find({}).sort({ createdAt: 1 });
    const existingStatewiseCharges = await StatewiseCharges.find({}).sort({ createdAt: 1 });

    console.log(`Found ${existingProviders.length} providers, ${existingFixedCharges.length} fixed charges, ${existingStatewiseCharges.length} statewise charges`);

    // Step 2: Clear all collections
    console.log('🗑️ Clearing existing data...');
    await Provider.deleteMany({});
    await FixedCharges.deleteMany({});
    await StatewiseCharges.deleteMany({});

    // Step 3: Recreate providers with sequential IDs
    console.log('👥 Recreating providers...');
    const newProviders = [];
    
    for (let i = 0; i < existingProviders.length; i++) {
      const provider = existingProviders[i];
      const newProvider = new Provider({
        providerId: i + 1,
        providerName: provider.providerName,
        description: provider.description || '',
        isActive: provider.isActive !== undefined ? provider.isActive : true
      });
      
      // Bypass the pre-save hook by directly saving
      newProvider.isNew = false;
      await newProvider.save();
      newProviders.push(newProvider);
    }

    // If no providers exist, create some default ones
    if (newProviders.length === 0) {
      console.log('📝 Creating default providers...');
      const defaultProviders = [
        { providerName: 'Express Logistics', description: 'Fast nationwide delivery' },
        { providerName: 'QuickShip', description: 'Affordable local delivery' },
        { providerName: 'SpeedCourier', description: 'Same day delivery service' },
        { providerName: 'ReliableTransport', description: 'Trusted logistics partner' },
        { providerName: 'FastTrack', description: 'Express shipping solutions' }
      ];

      for (let i = 0; i < defaultProviders.length; i++) {
        const provider = new Provider({
          providerId: i + 1,
          ...defaultProviders[i],
          isActive: true
        });
        provider.isNew = false;
        await provider.save();
        newProviders.push(provider);
      }
    }

    // Step 4: Recreate fixed charges
    console.log('💰 Recreating fixed charges...');
    const providerIdMap = new Map();
    newProviders.forEach((provider, index) => {
      providerIdMap.set(index + 1, provider.providerId);
    });

    for (let i = 0; i < existingFixedCharges.length; i++) {
      const fixedCharge = existingFixedCharges[i];
      const newProviderId = i + 1; // Sequential assignment
      
      // Ensure we don't exceed available providers
      if (newProviderId <= newProviders.length) {
        const newFixedCharge = new FixedCharges({
          providerId: newProviderId,
          docketCharge: fixedCharge.docketCharge || 50,
          codCharge: fixedCharge.codCharge || 45,
          holidayCharge: fixedCharge.holidayCharge || 25,
          outstationCharge: fixedCharge.outstationCharge || 40,
          insuranceChargePercent: fixedCharge.insuranceChargePercent || 2.5,
          ngtGreenTax: fixedCharge.ngtGreenTax || 5,
          keralaHandlingCharge: fixedCharge.keralaHandlingCharge || 15
        });
        
        newFixedCharge.isNew = false;
        await newFixedCharge.save();
      }
    }

    // If no fixed charges exist or fewer than providers, create them for all providers
    const currentFixedCharges = await FixedCharges.find({});
    if (currentFixedCharges.length < newProviders.length) {
      console.log('📝 Creating missing fixed charges...');
      for (let i = currentFixedCharges.length; i < newProviders.length; i++) {
        const newFixedCharge = new FixedCharges({
          providerId: i + 1,
          docketCharge: 50,
          codCharge: 45,
          holidayCharge: 25,
          outstationCharge: 40,
          insuranceChargePercent: 2.5,
          ngtGreenTax: 5,
          keralaHandlingCharge: 15
        });
        
        newFixedCharge.isNew = false;
        await newFixedCharge.save();
      }
    }

    // Step 5: Recreate statewise charges
    console.log('🗺️ Recreating statewise charges...');
    
    // Indian states list
    const indianStates = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
      'Jammu and Kashmir', 'Ladakh'
    ];

    // Create statewise charges for each provider-state combination
    for (let providerIndex = 0; providerIndex < newProviders.length; providerIndex++) {
      const provider = newProviders[providerIndex];
      
      for (const state of indianStates) {
        // Check if this combination already exists in old data
        const existingStateCharge = existingStatewiseCharges.find(sc => 
          sc.state && sc.state.toLowerCase() === state.toLowerCase()
        );
        
        const newStatewiseCharge = new StatewiseCharges({
          providerId: provider.providerId,
          providerName: provider.providerName,
          state: state,
          perKiloFee: existingStateCharge ? existingStateCharge.perKiloFee : (20 + Math.random() * 20), // Random between 20-40
          fuelSurcharge: existingStateCharge ? existingStateCharge.fuelSurcharge : (8 + Math.random() * 7) // Random between 8-15
        });
        
        newStatewiseCharge.isNew = false;
        await newStatewiseCharge.save();
      }
    }

    // Final counts
    const finalProviders = await Provider.countDocuments();
    const finalFixedCharges = await FixedCharges.countDocuments();
    const finalStatewiseCharges = await StatewiseCharges.countDocuments();

    console.log('✅ Database reindexing completed successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   - Providers: ${finalProviders}`);
    console.log(`   - Fixed Charges: ${finalFixedCharges}`);
    console.log(`   - Statewise Charges: ${finalStatewiseCharges}`);

    return {
      success: true,
      message: 'Database reindexing completed successfully',
      counts: {
        providers: finalProviders,
        fixedCharges: finalFixedCharges,
        statewiseCharges: finalStatewiseCharges
      }
    };

  } catch (error) {
    console.error('❌ Error during database reindexing:', error);
    throw error;
  }
}

module.exports = { reindexDatabase };
