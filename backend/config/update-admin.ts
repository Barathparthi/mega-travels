import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import connectDB from './database';
import User from '../models/user.model';
import { UserRole } from '../types';

async function updateAdmin() {
  try {
    console.log('🔐 Starting admin credentials update...');

    // Connect to database
    await connectDB();

    // Find admin user (password field is select: false, but we'll update it directly)
    const adminUser = await User.findOne({ role: UserRole.ADMIN });

    if (!adminUser) {
      console.error('❌ Admin user not found!');
      console.log('💡 Creating new admin user...');
      
      // Create new admin user
      const newAdmin = await User.create({
        name: 'Admin',
        email: 'admin@fleet.com',
        phone: '7358234473',
        password: '123456',
        role: UserRole.ADMIN,
        isActive: true,
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   📧 Email: ${newAdmin.email}`);
      console.log(`   📱 Phone: ${newAdmin.phone}`);
      console.log('   🔑 Password: 123456');
      process.exit(0);
      return;
    }

    console.log(`📋 Found admin user: ${adminUser.name} (${adminUser.email})`);

    // Update phone and password
    adminUser.phone = '7358234473';
    adminUser.password = '123456'; // Will be hashed by pre-save hook
    
    await adminUser.save();

    console.log('\n✅ Admin credentials updated successfully!');
    console.log('📊 Updated Details:');
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   📱 Phone: ${adminUser.phone}`);
    console.log('   🔑 Password: 123456');
    console.log('\n💡 You can now login with:');
    console.log('   - Email: admin@fleet.com');
    console.log('   - OR Phone: 7358234473');
    console.log('   - Password: 123456\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateAdmin();

