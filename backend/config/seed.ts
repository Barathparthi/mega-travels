import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import connectDB from './database';
import VehicleType from '../models/vehicle-type.model';
import User from '../models/user.model';
import Vehicle from '../models/vehicle.model';
import { VehicleTypeCode, UserRole, VehicleStatus } from '../types';

const vehicleTypesData = [
  {
    name: 'Maruti Dzire',
    code: VehicleTypeCode.DZIRE,
    billingRules: {
      baseAmount: 50000,
      baseDays: 20,
      extraDayRate: 2500,
      baseKms: 2000,
      extraKmRate: 13,
      baseHoursPerDay: 10,
      extraHourRate: 250,
    },
    isActive: true,
  },
  {
    name: 'Mahindra Bolero',
    code: VehicleTypeCode.BOLERO,
    billingRules: {
      baseAmount: 52000,
      baseDays: 20,
      extraDayRate: 2600,
      baseKms: 2000,
      extraKmRate: 14,
      baseHoursPerDay: 10,
      extraHourRate: 275,
    },
    isActive: true,
  },
  {
    name: 'Innova Crysta',
    code: VehicleTypeCode.CRYSTA,
    billingRules: {
      baseAmount: 54000,
      baseDays: 20,
      extraDayRate: 2700,
      baseKms: 2000,
      extraKmRate: 15,
      baseHoursPerDay: 10,
      extraHourRate: 300,
    },
    isActive: true,
  },
];

async function seed(clearExisting: boolean = false) {
  try {
    console.log('🌱 Starting seed process...');

    // Connect to database
    await connectDB();

    // Clear existing data if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing data...');
      await VehicleType.deleteMany({});
      await User.deleteMany({});
      await Vehicle.deleteMany({});
      console.log('✅ Existing data cleared');
    }

    // Seed Vehicle Types
    console.log('📦 Seeding vehicle types...');
    const createdVehicleTypes = await Promise.all(
      vehicleTypesData.map(async (data) => {
        const existing = await VehicleType.findOne({ code: data.code });
        if (existing) {
          console.log(`   ⚠️  ${data.name} already exists, skipping...`);
          return existing;
        }
        const vehicleType = await VehicleType.create(data);
        console.log(`   ✅ Created ${data.name}`);
        return vehicleType;
      })
    );

    // Seed Admin User
    console.log('👤 Seeding admin user...');
    const adminEmail = 'admin@fleet.com';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin',
        email: adminEmail,
        phone: '9999999999',
        password: 'Admin@123',
        role: UserRole.ADMIN,
        isActive: true,
      });
      console.log('   ✅ Admin user created');
      console.log(`   📧 Email: ${adminEmail}`);
      console.log('   🔑 Password: Admin@123');
    } else {
      console.log('   ⚠️  Admin user already exists');
    }

    // Seed Sample Data (optional)
    const createSamples = process.env.SEED_SAMPLES === 'true';

    if (createSamples) {
      console.log('🎭 Seeding sample data...');

      // Create sample drivers
      const driver1 = await User.findOne({ email: 'driver1@fleet.com' });
      if (!driver1) {
        await User.create({
          name: 'Mr. Manuvelraj',
          email: 'driver1@fleet.com',
          phone: '9876543210',
          password: 'Driver@123',
          role: UserRole.DRIVER,
          licenseNumber: 'TN1234567890',
          isActive: true,
        });
        console.log('   ✅ Sample driver 1 created');
      }

      const driver2 = await User.findOne({ email: 'driver2@fleet.com' });
      if (!driver2) {
        await User.create({
          name: 'Mr. Rajesh Kumar',
          email: 'driver2@fleet.com',
          phone: '9876543211',
          password: 'Driver@123',
          role: UserRole.DRIVER,
          licenseNumber: 'TN0987654321',
          isActive: true,
        });
        console.log('   ✅ Sample driver 2 created');
      }

      // Create sample vehicles
      const crystaType = createdVehicleTypes.find(
        (vt) => vt.code === VehicleTypeCode.CRYSTA
      );
      const dzireType = createdVehicleTypes.find(
        (vt) => vt.code === VehicleTypeCode.DZIRE
      );

      const vehicle1 = await Vehicle.findOne({ vehicleNumber: 'TN 11U 0474' });
      if (!vehicle1 && crystaType) {
        await Vehicle.create({
          vehicleNumber: 'TN 11U 0474',
          vehicleTypeId: crystaType._id,
          routeName: 'SIPCOT KAVARAPETTAI',
          description: 'AC INNOVA for SIPCOT',
          currentOdometer: 0,
          status: VehicleStatus.ACTIVE,
        });
        console.log('   ✅ Sample vehicle 1 created');
      }

      const vehicle2 = await Vehicle.findOne({ vehicleNumber: 'TN 09 AB 1234' });
      if (!vehicle2 && dzireType) {
        await Vehicle.create({
          vehicleNumber: 'TN 09 AB 1234',
          vehicleTypeId: dzireType._id,
          routeName: 'CHENNAI CENTRAL',
          description: 'AC Dzire for city routes',
          currentOdometer: 0,
          status: VehicleStatus.ACTIVE,
        });
        console.log('   ✅ Sample vehicle 2 created');
      }

      // Now assign vehicles to drivers
      console.log('🔗 Assigning vehicles to drivers...');

      // Get fresh data
      const v1 = await Vehicle.findOne({ vehicleNumber: 'TN 11U 0474' });
      const v2 = await Vehicle.findOne({ vehicleNumber: 'TN 09 AB 1234' });
      const d1 = await User.findOne({ email: 'driver1@fleet.com' });
      const d2 = await User.findOne({ email: 'driver2@fleet.com' });

      // Assign Vehicle 1 (Crysta) to Driver 1 (Mr. Manuvelraj)
      if (d1 && v1) {
        await User.findByIdAndUpdate(d1._id, { assignedVehicleId: v1._id });
        await Vehicle.findByIdAndUpdate(v1._id, { assignedDriverId: d1._id });
        console.log(`   ✅ Assigned ${v1.vehicleNumber} to ${d1.name}`);
      }

      // Assign Vehicle 2 (Dzire) to Driver 2 (Mr. Rajesh Kumar)
      if (d2 && v2) {
        await User.findByIdAndUpdate(d2._id, { assignedVehicleId: v2._id });
        await Vehicle.findByIdAndUpdate(v2._id, { assignedDriverId: d2._id });
        console.log(`   ✅ Assigned ${v2.vehicleNumber} to ${d2.name}`);
      }
    }

    console.log('\n✨ Seed process completed successfully!\n');
    console.log('📊 Summary:');
    console.log(
      `   - Vehicle Types: ${await VehicleType.countDocuments()}`
    );
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Vehicles: ${await Vehicle.countDocuments()}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear');

seed(clearExisting);
