import { z } from 'zod';

export const companySettingsSchema = z.object({
    'company.name': z.string().min(1, 'Company name is required'),
    'company.address1': z.string().optional(),
    'company.address2': z.string().optional(),
    'company.phone': z.string().optional(),
    'company.email': z
        .string()
        .email('Invalid email')
        .optional()
        .or(z.literal('')),
    'company.gst': z.string().optional(),
});

export const billingRulesSchema = z.object({
    'billing.baseDays': z.number().min(1).max(31),
    'billing.baseKms': z.number().min(0),
    'billing.baseHoursPerDay': z.number().min(1).max(24),
});

export const salaryRulesSchema = z.object({
    'salary.baseSalary': z.number().min(0),
    'salary.baseDays': z.number().min(1).max(31),
    'salary.baseHoursPerDay': z.number().min(1).max(24),
    'salary.extraDayRate': z.number().min(0),
    'salary.extraHourRate': z.number().min(0),
});

export const systemSettingsSchema = z.object({
    'system.tripsheetPrefix': z.string().min(1).max(10),
    'system.billPrefix': z.string().min(1).max(10),
    'system.salaryPrefix': z.string().min(1).max(10),
    'system.adminEmail': z
        .string()
        .email('Invalid email')
        .optional()
        .or(z.literal('')),
    'system.emailOnSubmit': z.boolean(),
    'system.emailOnBill': z.boolean(),
    'system.dailySummary': z.boolean(),
});

export const vehicleTypeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required').max(10),
    billingRules: z.object({
        baseAmount: z.number().min(0, 'Base amount must be positive'),
        baseDays: z.number().min(1).max(31),
        extraDayRate: z.number().min(0),
        baseKms: z.number().min(0),
        extraKmRate: z.number().min(0),
        baseHoursPerDay: z.number().min(1).max(24),
        extraHourRate: z.number().min(0),
    }),
    isActive: z.boolean().default(true),
});
