import { z } from 'zod';

export const tripEntrySchema = z.discriminatedUnion('status', [
  // For OFF day
  z.object({
    status: z.literal('off'),
    date: z.string(),
    remarks: z.string().max(500).optional(),
  }),

  // For WORKING day
  z.object({
    status: z.literal('working'),
    date: z.string(),
    startingKm: z
      .number({ message: 'Starting KM is required' })
      .min(0, 'Starting KM must be positive'),
    closingKm: z
      .number({ message: 'Closing KM is required' })
      .min(0, 'Closing KM must be positive'),
    startingTime: z
      .string({ message: 'Starting time is required' })
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    closingTime: z
      .string({ message: 'Closing time is required' })
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
    fuelLitres: z
      .number()
      .positive('Fuel litres must be positive')
      .optional()
      .nullable(),
    fuelAmount: z
      .number()
      .positive('Fuel amount must be positive')
      .optional()
      .nullable(),
    remarks: z.string().max(500).optional(),
  })
    .refine((data) => data.closingKm > data.startingKm, {
      message: 'Closing KM must be greater than Starting KM',
      path: ['closingKm'],
    })
    .refine(
      (data) => {
        const hasLitres = data.fuelLitres != null && data.fuelLitres > 0;
        const hasAmount = data.fuelAmount != null && data.fuelAmount > 0;
        // Both must be filled or both must be empty
        return hasLitres === hasAmount;
      },
      {
        message: 'Both fuel litres and amount are required when adding fuel',
        path: ['fuelAmount'],
      }
    ),
]);

export type TripEntryInput = z.infer<typeof tripEntrySchema>;
