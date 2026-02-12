import mongoose, { Schema, models } from 'mongoose';
import { IVehicleType, VehicleTypeCode } from '../types';

const billingRulesSchema = new Schema(
  {
    baseAmount: {
      type: Number,
      required: [true, 'Base amount is required'],
      min: [0, 'Base amount must be positive'],
    },
    baseDays: {
      type: Number,
      default: 20,
      min: [1, 'Base days must be at least 1'],
    },
    extraDayRate: {
      type: Number,
      required: [true, 'Extra day rate is required'],
      min: [0, 'Extra day rate must be positive'],
    },
    baseKms: {
      type: Number,
      default: 2000,
      min: [0, 'Base kms must be positive'],
    },
    extraKmRate: {
      type: Number,
      required: [true, 'Extra km rate is required'],
      min: [0, 'Extra km rate must be positive'],
    },
    baseHoursPerDay: {
      type: Number,
      default: 10,
      min: [1, 'Base hours must be at least 1'],
    },
    extraHourRate: {
      type: Number,
      required: [true, 'Extra hour rate is required'],
      min: [0, 'Extra hour rate must be positive'],
    },
  },
  { _id: false }
);

const vehicleTypeSchema = new Schema<IVehicleType>(
  {
    name: {
      type: String,
      required: [true, 'Vehicle type name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Vehicle type code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    billingRules: {
      type: billingRulesSchema,
      required: [true, 'Billing rules are required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: code and name indexes are created automatically by unique: true
vehicleTypeSchema.index({ isActive: 1 });

const VehicleType =
  models.VehicleTypeV2 ||
  mongoose.model<IVehicleType>('VehicleTypeV2', vehicleTypeSchema, 'vehicletypes');

export default VehicleType;
