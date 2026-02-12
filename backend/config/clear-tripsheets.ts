import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import connectDB from './database';
import Tripsheet from '../models/tripsheet.model';

async function clearAllTripsheets() {
  try {
    console.log('🗑️  Starting tripsheet cleanup...');
    await connectDB();

    // Delete all tripsheets
    const result = await Tripsheet.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} tripsheet(s) from the database.`);
    console.log('📊 All tripsheet entries have been cleared.');
    console.log('🚀 The system is now ready for fresh entries starting from January 1, 2026.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear tripsheets:', error);
    process.exit(1);
  }
}

clearAllTripsheets();

