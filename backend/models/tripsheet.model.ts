import mongoose, { Schema, models } from 'mongoose';
import { ITripsheet, DayType, TripsheetStatus, EntryStatus } from '../types';
import {
  calculateTotalHours,
  calculateExtraHours,
  calculateDriverExtraHours,
  getDayType,
  getDayName,
} from '../utils/time-calculator';

const tripsheetEntrySchema = new Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    dayOfWeek: {
      type: String,
      required: true,
    },
    dayType: {
      type: String,
      enum: Object.values(DayType),
      default: DayType.WORKING,
    },
    status: {
      type: String,
      enum: Object.values(EntryStatus),
      default: EntryStatus.PENDING,
    },
    startingKm: {
      type: Number,
      min: [0, 'Starting km must be positive'],
    },
    closingKm: {
      type: Number,
      min: [0, 'Closing km must be positive'],
    },
    totalKm: {
      type: Number,
      min: [0, 'Total km must be positive'],
    },
    startingTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },
    closingTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },
    fromLocation: {
      type: String,
      trim: true,
    },
    toLocation: {
      type: String,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: ['single', 'double'],
      default: 'single',
    },
    totalHours: {
      type: Number,
      min: [0, 'Total hours must be positive'],
    },
    extraHours: {
      type: Number,
      min: [0, 'Extra hours must be positive'],
    },
    driverExtraHours: {
      type: Number,
      min: [0, 'Driver extra hours must be positive'],
    },
    fuelLitres: {
      type: Number,
      min: [0, 'Fuel litres must be positive'],
    },
    fuelAmount: {
      type: Number,
      min: [0, 'Fuel amount must be positive'],
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const summarySchema = new Schema(
  {
    totalWorkingDays: {
      type: Number,
      default: 0,
      min: [0, 'Total working days must be positive'],
    },
    totalOffDays: {
      type: Number,
      default: 0,
      min: [0, 'Total off days must be positive'],
    },
    totalPendingDays: {
      type: Number,
      default: 0,
      min: [0, 'Total pending days must be positive'],
    },
    totalKms: {
      type: Number,
      default: 0,
      min: [0, 'Total kms must be positive'],
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, 'Total hours must be positive'],
    },
    totalExtraHours: {
      type: Number,
      default: 0,
      min: [0, 'Total extra hours must be positive'],
    },
    totalDriverExtraHours: {
      type: Number,
      default: 0,
      min: [0, 'Total driver extra hours must be positive'],
    },
    totalFuelLitres: {
      type: Number,
      default: 0,
      min: [0, 'Total fuel litres must be positive'],
    },
    totalFuelAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total fuel amount must be positive'],
    },
  },
  { _id: false }
);

const tripsheetSchema = new Schema<ITripsheet>(
  {
    tripsheetNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2026, 'Year must be 2026 or later'],
    },
    entries: {
      type: [tripsheetEntrySchema],
      default: [],
    },
    summary: {
      type: summarySchema,
      default: () => ({
        totalWorkingDays: 0,
        totalOffDays: 0,
        totalPendingDays: 0,
        totalKms: 0,
        totalHours: 0,
        totalExtraHours: 0,
        totalDriverExtraHours: 0,
        totalFuelLitres: 0,
        totalFuelAmount: 0,
      }),
    },
    status: {
      type: String,
      enum: Object.values(TripsheetStatus),
      default: TripsheetStatus.DRAFT,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: tripsheetNumber index is created automatically by unique: true (sparse)
tripsheetSchema.index({ vehicleId: 1 });
tripsheetSchema.index({ driverId: 1 });
tripsheetSchema.index({ month: 1, year: 1 });
tripsheetSchema.index({ status: 1 });
tripsheetSchema.index({ createdAt: -1 });

// Compound index for unique month/year per vehicle
tripsheetSchema.index(
  { vehicleId: 1, month: 1, year: 1 },
  { unique: true }
);

// Pre-save hook to calculate values
tripsheetSchema.pre('save', function () {
  // Auto-fill dayOfWeek and dayType for entries
  this.entries.forEach((entry) => {
    if (!entry.dayOfWeek) {
      entry.dayOfWeek = getDayName(entry.date);
    }
    if (!entry.dayType) {
      entry.dayType = getDayType(entry.date);
    }

    // Calculate totals only for working days
    if (entry.dayType === DayType.WORKING) {
      // Calculate total km - ensure integer values to prevent precision issues
      if (
        entry.startingKm !== undefined &&
        entry.closingKm !== undefined
      ) {
        entry.startingKm = Math.round(entry.startingKm);
        entry.closingKm = Math.round(entry.closingKm);
        entry.totalKm = Math.round(entry.closingKm - entry.startingKm);
      }

      // Calculate total hours
      if (entry.startingTime && entry.closingTime) {
        entry.totalHours = calculateTotalHours(
          entry.startingTime,
          entry.closingTime
        );
        entry.extraHours = calculateExtraHours(entry.totalHours);

        // Calculate driver extra hours for working entries
        if (entry.status === EntryStatus.WORKING) {
          entry.driverExtraHours = calculateDriverExtraHours(entry.totalHours);
        }
      }
    }
  });

  // Calculate summary
  // Count all entries with status 'working' regardless of dayType (includes Sunday/Saturday work)
  const workingEntries = this.entries.filter(
    (e) => e.status === EntryStatus.WORKING
  );
  const offEntries = this.entries.filter(
    (e) => e.status === EntryStatus.OFF
  );
  const pendingEntries = this.entries.filter(
    (e) => e.status === EntryStatus.PENDING
  );

  this.summary = {
    totalWorkingDays: workingEntries.length,
    totalOffDays: offEntries.length,
    totalPendingDays: pendingEntries.length,
    totalKms: workingEntries.reduce((sum, e) => sum + (e.totalKm || 0), 0),
    totalHours: workingEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0),
    totalExtraHours: workingEntries.reduce(
      (sum, e) => sum + (e.extraHours || 0),
      0
    ),
    totalDriverExtraHours: workingEntries.reduce(
      (sum, e) => sum + (e.driverExtraHours || 0),
      0
    ),
    totalFuelLitres: this.entries.reduce(
      (sum, e) => sum + (e.fuelLitres || 0),
      0
    ),
    totalFuelAmount: this.entries.reduce(
      (sum, e) => sum + (e.fuelAmount || 0),
      0
    ),
  };
});

// Static method to generate tripsheet number
tripsheetSchema.statics.generateTripsheetNumber = async function (
  year: number
): Promise<string> {
  const count = await this.countDocuments({
    tripsheetNumber: new RegExp(`^TS-${year}-`),
  });

  const sequence = count + 1;
  return `TS-${year}-${String(sequence).padStart(4, '0')}`;
};

const Tripsheet =
  models.Tripsheet ||
  mongoose.model<ITripsheet>('Tripsheet', tripsheetSchema);

export default Tripsheet;
