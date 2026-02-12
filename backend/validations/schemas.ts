import { z } from 'zod';
import { UserRole, DayType } from '../types';

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Vehicle Schema
export const vehicleSchema = z.object({
  vehicleNumber: z
    .string()
    .min(1, 'Vehicle number is required')
    .regex(
      /^[A-Z]{2}\s?\d{1,2}[A-Z]{0,2}\s?\d{4}$/i,
      'Invalid vehicle number format'
    )
    .transform((val) => val.toUpperCase()),
  vehicleTypeId: z.string().min(1, 'Vehicle type is required'),
  assignedDriverId: z.string().optional(),
  routeName: z.string().optional(),
  description: z.string().optional(),
  currentOdometer: z.number().min(0, 'Odometer must be positive').optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).optional(),
});

// User Schema
export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.DRIVER),
  assignedVehicleId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Trip Entry Schema
export const tripEntrySchema = z
  .object({
    date: z.coerce.date(),
    dayOfWeek: z.string().optional(),
    dayType: z.nativeEnum(DayType).optional(),
    startingKm: z.number().min(0, 'Starting km must be positive').optional(),
    closingKm: z.number().min(0, 'Closing km must be positive').optional(),
    startingTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
      .optional(),
    closingTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
      .optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      // Closing km should be greater than starting km
      if (
        data.startingKm !== undefined &&
        data.closingKm !== undefined
      ) {
        return data.closingKm >= data.startingKm;
      }
      return true;
    },
    {
      message: 'Closing km must be greater than or equal to starting km',
      path: ['closingKm'],
    }
  );

// Tripsheet Schema
export const tripsheetSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  month: z
    .number()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020, 'Year must be 2020 or later'),
  entries: z.array(tripEntrySchema).default([]),
  status: z.enum(['draft', 'submitted', 'approved']).optional(),
});

// Password Update Schema
export const passwordUpdateSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type TripEntryInput = z.infer<typeof tripEntrySchema>;
export type TripsheetInput = z.infer<typeof tripsheetSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
