
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { compare, hash } from 'bcryptjs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: { type: String, select: true },
    role: String,
    isActive: Boolean,
}, { timestamps: true });

const User = (mongoose.models.User || mongoose.model('User', userSchema)) as any;

async function checkUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`\nTotal users: ${users.length}`);

        const admins = users.filter((u: any) => u.role === 'admin');
        console.log(`Admins: ${admins.length}`);
        if (admins.length > 0) {
            admins.forEach((u: any) => console.log(` - ${u.name} (${u.email})`));
        } else {
            console.log('WARNING: No admin users found!');

            // Ask if we should create an admin? Or just check if "admin@example.com" exists and promote them?
            // For now, just report.
        }

        // Check specific user for login capability
        const TEST_PHONE = '8754307135';
        const TEST_PASS = 'password123';

        const user = await User.findOne({ phone: TEST_PHONE }).select('+password');
        if (user) {
            const works = await compare(TEST_PASS, user.password);
            console.log(`\nUser ${user.name} (${user.phone}) login with '${TEST_PASS}' works? ${works}`);
        } else {
            console.log(`User ${TEST_PHONE} not found.`);
        }

        await mongoose.disconnect();
        console.log('\nDone.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
