import mongoose, { Schema, models } from 'mongoose';
import { IDriverSalary, DriverSalaryStatus } from '../types';

const driverSalaryCalculationSchema = new Schema(
  {
    totalWorkingDays: {
      type: Number,
      required: true,
      min: [0, 'Total working days must be positive'],
    },
    baseDays: {
      type: Number,
      default: 22,
      min: [0, 'Base days must be positive'],
    },
    extraDays: {
      type: Number,
      default: 0,
      min: [0, 'Extra days must be positive'],
    },
    baseSalary: {
      type: Number,
      default: 20000,
      min: [0, 'Base salary must be positive'],
    },
    extraDayRate: {
      type: Number,
      default: 909,
      min: [0, 'Extra day rate must be positive'],
    },
    extraDaysAmount: {
      type: Number,
      default: 0,
      min: [0, 'Extra days amount must be positive'],
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, 'Total hours must be positive'],
    },
    totalDriverExtraHours: {
      type: Number,
      default: 0,
      min: [0, 'Total driver extra hours must be positive'],
    },
    extraHourRate: {
      type: Number,
      default: 80,
      min: [0, 'Extra hour rate must be positive'],
    },
    extraHoursAmount: {
      type: Number,
      default: 0,
      min: [0, 'Extra hours amount must be positive'],
    },
    totalSalary: {
      type: Number,
      required: true,
      min: [0, 'Total salary must be positive'],
    },
    advanceDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Advance deduction must be positive'],
    },
    amountInWords: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const driverSalarySchema = new Schema<IDriverSalary>(
  {
    salaryId: {
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
    tripsheetId: {
      type: Schema.Types.ObjectId,
      ref: 'Tripsheet',
      required: [true, 'Tripsheet is required'],
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
      min: [2020, 'Year must be 2020 or later'],
    },
    calculation: {
      type: driverSalaryCalculationSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DriverSalaryStatus),
      default: DriverSalaryStatus.GENERATED,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
driverSalarySchema.index({ salaryId: 1 });
driverSalarySchema.index({ driverId: 1 });
driverSalarySchema.index({ vehicleId: 1 });
driverSalarySchema.index({ tripsheetId: 1 });
driverSalarySchema.index({ month: 1, year: 1 });
driverSalarySchema.index({ status: 1 });
driverSalarySchema.index({ createdAt: -1 });

// Unique compound index: one salary per driver per month/year
driverSalarySchema.index(
  { driverId: 1, month: 1, year: 1 },
  { unique: true }
);

// Static method to generate salary ID
driverSalarySchema.statics.generateSalaryId = async function (
  year: number
): Promise<string> {
  const count = await this.countDocuments({
    salaryId: new RegExp(`^SAL-${year}-`),
  });

  const sequence = count + 1;
  return `SAL-${year}-${String(sequence).padStart(4, '0')}`;
};

// Pre-save hook to generate salary ID
driverSalarySchema.pre('save', async function () {
  if (!this.salaryId) {
    this.salaryId = await (this.constructor as any).generateSalaryId(this.year);
  }
});

const DriverSalary =
  models.DriverSalary ||
  mongoose.model<IDriverSalary>('DriverSalary', driverSalarySchema);

export default DriverSalary;
