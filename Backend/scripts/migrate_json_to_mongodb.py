#!/usr/bin/env python3
"""
Migration script to populate MongoDB with data from JSON files.
This script reads the JSON files and populates the MongoDB collections
with the same data structure as expected by the backend models.
"""

import json
import os
from pymongo import MongoClient
import sys
from datetime import datetime

# MongoDB connection details
MONGODB_URI = "mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/"
DATABASE_NAME = "test"  # Default database name for mongoose

def connect_to_mongodb():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        print(f"✅ Connected to MongoDB database: {DATABASE_NAME}")
        return db
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        sys.exit(1)

def load_json_file(file_path):
    """Load data from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        print(f"✅ Loaded {len(data)} records from {os.path.basename(file_path)}")
        return data
    except Exception as e:
        print(f"❌ Error loading {file_path}: {e}")
        return []

def migrate_providers(db, json_data):
    """Migrate providers data to MongoDB"""
    collection = db['providers']
    
    # Clear existing data
    collection.delete_many({})
    print("🗑️  Cleared existing providers collection")
    
    # Transform and insert data
    providers = []
    for item in json_data:
        provider = {
            "providerId": item["Provider ID"],
            "providerName": item["Provider Name"],
            "description": f"Status: {item.get('Unnamed: 2', 'Unknown')}",
            "isActive": item.get('Unnamed: 2') == 'recd',
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        providers.append(provider)
    
    if providers:
        result = collection.insert_many(providers)
        print(f"✅ Migrated {len(result.inserted_ids)} providers to MongoDB")
    
    return len(providers)

def migrate_fixed_charges(db, json_data):
    """Migrate fixed charges data to MongoDB"""
    collection = db['fixedcharges']
    
    # Clear existing data
    collection.delete_many({})
    print("🗑️  Cleared existing fixed charges collection")
    
    # Transform and insert data
    fixed_charges = []
    for item in json_data:
        charge = {
            "providerId": item["Provider ID"],
            "docketCharge": item["Docket Charge (INR)"],
            "codCharge": item["COD Charge (INR)"],
            "holidayCharge": item["Holiday Charge (INR)"],
            "outstationCharge": item["Outstation Charge (INR)"],
            "insuranceChargePercent": item["Insurance Charge (%)"],
            "ngtGreenTax": item["NGT Green Tax (INR)"],
            "keralaHandlingCharge": item["Kerala North East Handling Charge (INR)"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        fixed_charges.append(charge)
    
    if fixed_charges:
        result = collection.insert_many(fixed_charges)
        print(f"✅ Migrated {len(result.inserted_ids)} fixed charges to MongoDB")
    
    return len(fixed_charges)

def migrate_statewise_charges(db, json_data, providers_data):
    """Migrate statewise charges data to MongoDB"""
    collection = db['statewisecharges']
    
    # Clear existing data
    collection.delete_many({})
    print("🗑️  Cleared existing statewise charges collection")
    
    # Create provider lookup dictionary
    provider_lookup = {}
    for provider in providers_data:
        provider_lookup[provider["Provider ID"]] = provider["Provider Name"]
    
    # Transform and insert data
    statewise_charges = []
    for item in json_data:
        provider_id = item["Provider ID"]
        provider_name = provider_lookup.get(provider_id, f"Provider {provider_id}")
        
        charge = {
            "providerId": provider_id,
            "providerName": provider_name,
            "state": item["State"],
            "perKiloFee": float(item["Per Kilo Fee (INR)"]),
            "fuelSurcharge": item["Fuel Surcharge (%)"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        statewise_charges.append(charge)
    
    if statewise_charges:
        # Insert in batches to avoid memory issues
        batch_size = 1000
        total_inserted = 0
        
        for i in range(0, len(statewise_charges), batch_size):
            batch = statewise_charges[i:i + batch_size]
            result = collection.insert_many(batch)
            total_inserted += len(result.inserted_ids)
            print(f"📦 Inserted batch {i//batch_size + 1}: {len(result.inserted_ids)} records")
        
        print(f"✅ Migrated {total_inserted} statewise charges to MongoDB")
    
    return len(statewise_charges)

def main():
    """Main migration function"""
    print("🚀 Starting JSON to MongoDB migration...")
    print("=" * 50)
    
    # Connect to MongoDB
    db = connect_to_mongodb()
    
    # Define file paths (relative to shipping-dashboard folder)
    base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "shipping-dashboard")
    
    providers_file = os.path.join(base_path, "Providers.json")
    fixed_charges_file = os.path.join(base_path, "Fixed_Charges.json")
    statewise_charges_file = os.path.join(base_path, "Statewise_Charges.json")
    
    # Check if files exist
    for file_path in [providers_file, fixed_charges_file, statewise_charges_file]:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            sys.exit(1)
    
    try:
        # Load JSON data
        print("\n📂 Loading JSON files...")
        providers_data = load_json_file(providers_file)
        fixed_charges_data = load_json_file(fixed_charges_file)
        statewise_charges_data = load_json_file(statewise_charges_file)
        
        if not all([providers_data, fixed_charges_data, statewise_charges_data]):
            print("❌ Failed to load one or more JSON files")
            sys.exit(1)
        
        # Migrate data
        print("\n🔄 Starting migration...")
        
        providers_count = migrate_providers(db, providers_data)
        fixed_count = migrate_fixed_charges(db, fixed_charges_data)
        statewise_count = migrate_statewise_charges(db, statewise_charges_data, providers_data)
        
        print("\n" + "=" * 50)
        print("🎉 Migration completed successfully!")
        print(f"📊 Summary:")
        print(f"   • Providers: {providers_count} records")
        print(f"   • Fixed Charges: {fixed_count} records")
        print(f"   • Statewise Charges: {statewise_count} records")
        print(f"   • Total: {providers_count + fixed_count + statewise_count} records")
        
        # Verify data
        print("\n🔍 Verifying migration...")
        providers_in_db = db['providers'].count_documents({})
        fixed_in_db = db['fixedcharges'].count_documents({})
        statewise_in_db = db['statewisecharges'].count_documents({})
        
        print(f"✅ Verification results:")
        print(f"   • Providers in DB: {providers_in_db}")
        print(f"   • Fixed Charges in DB: {fixed_in_db}")
        print(f"   • Statewise Charges in DB: {statewise_in_db}")
        
        if (providers_in_db == providers_count and 
            fixed_in_db == fixed_count and 
            statewise_in_db == statewise_count):
            print("✅ All data migrated successfully!")
        else:
            print("⚠️  Some data may not have been migrated correctly")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
