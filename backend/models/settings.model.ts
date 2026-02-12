import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        category: {
            type: String,
            enum: ['company', 'billing', 'salary', 'system'],
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// Default settings
const DEFAULT_SETTINGS: Record<string, any> = {
    // Company
    'company.name': 'Mayaa Enterprises',
    'company.address1': '',
    'company.address2': '',
    'company.phone': '',
    'company.email': '',
    'company.gst': '',
    'company.logo': '/logo.png',

    // Billing Rules
    'billing.baseDays': 20,
    'billing.baseKms': 2000,
    'billing.baseHoursPerDay': 10,

    // Salary Rules
    'salary.baseSalary': 20000,
    'salary.baseDays': 22,
    'salary.baseHoursPerDay': 12,
    'salary.extraDayRate': 909,
    'salary.extraHourRate': 80,

    // System
    'system.tripsheetPrefix': 'TS',
    'system.billPrefix': 'BILL',
    'system.salaryPrefix': 'SAL',
    'system.adminEmail': '',
    'system.emailOnSubmit': true,
    'system.emailOnBill': true,
    'system.dailySummary': false,
};

// Static method to get setting
settingsSchema.statics.getSetting = async function (key: string) {
    const setting = await this.findOne({ key });
    return setting?.value ?? DEFAULT_SETTINGS[key];
};

// Static method to set setting
settingsSchema.statics.setSetting = async function (
    key: string,
    value: any,
    category: string,
    userId?: string
) {
    return this.findOneAndUpdate(
        { key },
        { key, value, category, updatedBy: userId },
        { upsert: true, new: true }
    );
};

// Static method to get all settings by category
settingsSchema.statics.getByCategory = async function (category: string) {
    const settings = await this.find({ category });
    const result: Record<string, any> = {};

    // Start with defaults
    Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => {
        if (k.startsWith(category + '.')) {
            result[k] = v;
        }
    });

    // Override with saved values
    settings.forEach((s: any) => {
        result[s.key] = s.value;
    });

    return result;
};

// Static method to get all settings
settingsSchema.statics.getAll = async function () {
    const settings = await this.find({});
    const result: Record<string, any> = { ...DEFAULT_SETTINGS };

    // Override with saved values
    settings.forEach((s: any) => {
        result[s.key] = s.value;
    });

    return result;
};

const Settings =
    mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings;
