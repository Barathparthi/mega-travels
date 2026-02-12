import mongoose, { Schema, models } from 'mongoose';

export interface IVehicleService {
  _id: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  serviceType: string; // e.g., "Oil Service", "Full Service", "Tire Replacement"
  serviceDate: Date;
  serviceKm: number; // KM reading when service was done
  nextServiceKm?: number; // Expected next service KM (optional)
  serviceIntervalKm?: number; // Service interval in KM (e.g., 10000)
  cost?: number;
  serviceProvider?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleServiceSchema = new Schema<IVehicleService>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
    },
    serviceDate: {
      type: Date,
      required: [true, 'Service date is required'],
    },
    serviceKm: {
      type: Number,
      required: [true, 'Service KM is required'],
      min: [0, 'Service KM must be positive'],
    },
    nextServiceKm: {
      type: Number,
      min: [0, 'Next service KM must be positive'],
    },
    serviceIntervalKm: {
      type: Number,
      default: 10000, // Default 10,000 km interval
      min: [0, 'Service interval must be positive'],
    },
    cost: {
      type: Number,
      min: [0, 'Cost must be positive'],
    },
    serviceProvider: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
vehicleServiceSchema.index({ vehicleId: 1, serviceDate: -1 });
vehicleServiceSchema.index({ vehicleId: 1, serviceKm: -1 });

const VehicleService =
  models.VehicleService ||
  mongoose.model<IVehicleService>('VehicleService', vehicleServiceSchema);

export default VehicleService;

