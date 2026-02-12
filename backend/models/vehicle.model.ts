import mongoose, { Schema, models } from 'mongoose';
import { IVehicle, VehicleStatus } from '../types';

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicleTypeId: {
      type: String, // Changed to String to match existing data (e.g., "Innova Crysta")
      required: [true, 'Vehicle type is required'],
    },
    assignedDriverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    routeName: {
      type: String,
      trim: true,
    },
    driverPassengers: {
      type: String, // Number of passengers allowed for the driver or crew details
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    currentOdometer: {
      type: Number,
      default: 0,
      min: [0, 'Odometer reading must be positive'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(VehicleStatus),
        message: '{VALUE} is not a valid status',
      },
      default: VehicleStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Note: vehicleNumber index is created automatically by unique: true
vehicleSchema.index({ vehicleTypeId: 1 });
vehicleSchema.index({ assignedDriverId: 1 });
vehicleSchema.index({ status: 1 });

// Virtual populate for vehicle type
vehicleSchema.virtual('vehicleType', {
  ref: 'VehicleTypeV2',
  localField: 'vehicleTypeId',
  foreignField: 'name', // Match by name instead of _id
  justOne: true,
});

// Virtual populate for assigned driver
vehicleSchema.virtual('assignedDriver', {
  ref: 'User',
  localField: 'assignedDriverId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save hook to format vehicle number
vehicleSchema.pre('save', function () {
  if (this.isModified('vehicleNumber')) {
    // Remove extra spaces and convert to uppercase
    this.vehicleNumber = this.vehicleNumber.replace(/\s+/g, ' ').toUpperCase();
  }
});

const Vehicle =
  models.Vehicle || mongoose.model<IVehicle>('Vehicle', vehicleSchema);

export default Vehicle;
