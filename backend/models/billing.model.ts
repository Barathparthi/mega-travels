import mongoose, { Schema, models } from 'mongoose';
import { IBilling, BillingStatus } from '../types';
import { numberToIndianWords } from '../utils/number-to-words';

const calculationSchema = new Schema(
  {
    totalWorkingDays: {
      type: Number,
      required: true,
      min: [0, 'Total working days must be positive'],
    },
    baseDays: {
      type: Number,
      required: true,
    },
    extraDays: {
      type: Number,
      required: true,
      min: [0, 'Extra days must be positive'],
    },
    baseAmount: {
      type: Number,
      required: true,
    },
    extraDayRate: {
      type: Number,
      required: true,
    },
    extraDaysAmount: {
      type: Number,
      required: true,
      min: [0, 'Extra days amount must be positive'],
    },
    totalKms: {
      type: Number,
      required: true,
      min: [0, 'Total kms must be positive'],
    },
    baseKms: {
      type: Number,
      required: true,
    },
    extraKms: {
      type: Number,
      required: true,
      min: [0, 'Extra kms must be positive'],
    },
    extraKmRate: {
      type: Number,
      required: true,
    },
    extraKmsAmount: {
      type: Number,
      required: true,
      min: [0, 'Extra kms amount must be positive'],
    },
    totalHours: {
      type: Number,
      required: true,
      min: [0, 'Total hours must be positive'],
    },
    baseHoursPerDay: {
      type: Number,
      required: true,
    },
    totalBaseHours: {
      type: Number,
      required: true,
      min: [0, 'Total base hours must be positive'],
    },
    totalExtraHours: {
      type: Number,
      required: true,
      min: [0, 'Total extra hours must be positive'],
    },
    extraHourRate: {
      type: Number,
      required: true,
    },
    extraHoursAmount: {
      type: Number,
      required: true,
      min: [0, 'Extra hours amount must be positive'],
    },
    subTotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal must be positive'],
    },
    adjustments: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be positive'],
    },
    amountInWords: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const billingSchema = new Schema<IBilling>(
  {
    billNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    tripsheetId: {
      type: Schema.Types.ObjectId,
      ref: 'Tripsheet',
      required: [true, 'Tripsheet is required'],
      unique: true,
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
    vehicleTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'VehicleTypeV2',
      required: [true, 'Vehicle type is required'],
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
      type: calculationSchema,
      required: [true, 'Calculation is required'],
    },
    status: {
      type: String,
      enum: Object.values(BillingStatus),
      default: BillingStatus.GENERATED,
    },
    sentAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
billingSchema.index({ billNumber: 1 });
billingSchema.index({ tripsheetId: 1 });
billingSchema.index({ vehicleId: 1 });
billingSchema.index({ driverId: 1 });
billingSchema.index({ month: 1, year: 1 });
billingSchema.index({ status: 1 });
billingSchema.index({ createdAt: -1 });

// Pre-save hook to convert amount to words
billingSchema.pre('save', function () {
  if (
    this.isModified('calculation.totalAmount') ||
    !this.calculation.amountInWords
  ) {
    this.calculation.amountInWords = numberToIndianWords(
      this.calculation.totalAmount
    );
  }
});

// Static method to generate bill number
billingSchema.statics.generateBillNumber = async function (
  year: number
): Promise<string> {
  const count = await this.countDocuments({
    billNumber: new RegExp(`^BILL-${year}-`),
  });

  const sequence = count + 1;
  return `BILL-${year}-${String(sequence).padStart(4, '0')}`;
};

// Interface for static methods
interface IBillingModel extends mongoose.Model<IBilling> {
  generateBillNumber(year: number): Promise<string>;
}

const Billing =
  (models.Billing as IBillingModel) ||
  mongoose.model<IBilling, IBillingModel>('Billing', billingSchema);

export default Billing;
