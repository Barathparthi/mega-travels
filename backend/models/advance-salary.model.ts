import mongoose, { Schema, models } from 'mongoose';

export enum AdvanceSalaryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  DEDUCTED = 'deducted', // Deducted from salary
}

export interface IAdvanceSalary {
  _id: mongoose.Types.ObjectId;
  advanceId: string; // Unique ID like ADV-2025-0001
  driverId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  amount: number;
  requestedDate: Date;
  requestedMonth: number; // Month for which advance is requested
  requestedYear: number; // Year for which advance is requested
  reason?: string;
  status: AdvanceSalaryStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  deductedFromSalaryId?: mongoose.Types.ObjectId; // Salary ID from which it was deducted
  deductedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const advanceSalarySchema = new Schema<IAdvanceSalary>(
  {
    advanceId: {
      type: String,
      unique: true,
      sparse: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    requestedDate: {
      type: Date,
      required: [true, 'Requested date is required'],
      default: Date.now,
    },
    requestedMonth: {
      type: Number,
      required: [true, 'Requested month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    requestedYear: {
      type: Number,
      required: [true, 'Requested year is required'],
      min: [2020, 'Year must be 2020 or later'],
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(AdvanceSalaryStatus),
      default: AdvanceSalaryStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deductedFromSalaryId: {
      type: Schema.Types.ObjectId,
      ref: 'DriverSalary',
    },
    deductedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
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
advanceSalarySchema.index({ advanceId: 1 });
advanceSalarySchema.index({ driverId: 1 });
advanceSalarySchema.index({ vehicleId: 1 });
advanceSalarySchema.index({ status: 1 });
advanceSalarySchema.index({ requestedMonth: 1, requestedYear: 1 });
advanceSalarySchema.index({ createdAt: -1 });
advanceSalarySchema.index({ driverId: 1, requestedMonth: 1, requestedYear: 1 });

// Static method to generate advance ID
advanceSalarySchema.statics.generateAdvanceId = async function (
  year: number
): Promise<string> {
  const count = await this.countDocuments({
    advanceId: new RegExp(`^ADV-${year}-`),
  });

  const sequence = count + 1;
  return `ADV-${year}-${String(sequence).padStart(4, '0')}`;
};

// Pre-save hook to generate advance ID
advanceSalarySchema.pre('save', async function () {
  if (!this.advanceId) {
    this.advanceId = await (this.constructor as any).generateAdvanceId(
      this.requestedYear
    );
  }
});

const AdvanceSalary =
  models.AdvanceSalary ||
  mongoose.model<IAdvanceSalary>('AdvanceSalary', advanceSalarySchema);

export default AdvanceSalary;

