import mongoose, { Schema, models } from 'mongoose';

export interface ILoanPayment {
  emiDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
  remarks?: string;
}

export interface IVehicleLoan {
  _id: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleNumber: string;
  financeName: string;
  accountName: string;
  loanStartDate: Date;
  loanAmount?: number;
  emiAmount: number;
  totalEmis?: number; // Total number of EMIs
  emiDate: number; // Day of month (e.g., 3, 5, 10, 15, 17, 20)
  payments: ILoanPayment[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const loanPaymentSchema = new Schema<ILoanPayment>(
  {
    emiDate: {
      type: Date,
      required: [true, 'EMI date is required'],
    },
    amount: {
      type: Number,
      required: [true, 'EMI amount is required'],
      min: [0, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
    paidDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const vehicleLoanSchema = new Schema<IVehicleLoan>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    financeName: {
      type: String,
      required: [true, 'Finance name is required'],
      trim: true,
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    loanStartDate: {
      type: Date,
      required: [true, 'Loan start date is required'],
    },
    loanAmount: {
      type: Number,
      min: [0, 'Loan amount must be positive'],
    },
    emiAmount: {
      type: Number,
      required: [true, 'EMI amount is required'],
      min: [0, 'EMI amount must be positive'],
    },
    totalEmis: {
      type: Number,
      min: [1, 'Total EMIs must be at least 1'],
    },
    emiDate: {
      type: Number,
      required: [true, 'EMI date is required'],
      min: [1, 'EMI date must be between 1 and 31'],
      max: [31, 'EMI date must be between 1 and 31'],
    },
    payments: {
      type: [loanPaymentSchema],
      default: [],
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
vehicleLoanSchema.index({ vehicleId: 1 });
vehicleLoanSchema.index({ financeName: 1 });
vehicleLoanSchema.index({ isActive: 1 });
vehicleLoanSchema.index({ 'payments.emiDate': 1 });
vehicleLoanSchema.index({ 'payments.status': 1 });

const VehicleLoan =
  models.VehicleLoan ||
  mongoose.model<IVehicleLoan>('VehicleLoan', vehicleLoanSchema);

export default VehicleLoan;

