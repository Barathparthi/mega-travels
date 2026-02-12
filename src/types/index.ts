import { Document, Types } from 'mongoose';

// User Types
export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle Type
export interface IVehicleType extends Document {
  _id: Types.ObjectId;
  name: string;
  baseRate: number;
  perKmRate: number;
  perHourRate: number;
  driverAllowancePerDay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle
export interface IVehicle extends Document {
  _id: Types.ObjectId;
  vehicleNumber: string;
  vehicleType: Types.ObjectId | IVehicleType;
  vehicleModel: string;
  make: string;
  year: number;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Trip Sheet
export enum TripStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  BILLED = 'billed',
}

export interface ITripSheet extends Document {
  _id: Types.ObjectId;
  tripSheetNumber: string;
  driver: Types.ObjectId | IUser;
  vehicle: Types.ObjectId | IVehicle;
  startDate: Date;
  endDate: Date;
  startingKm: number;
  closingKm: number;
  totalKm: number;
  totalHours: number;
  guestName: string;
  guestMobile: string;
  guestAddress: string;
  purpose: string;
  places: string[];
  tollCharges: number;
  parkingCharges: number;
  otherCharges: number;
  remarks?: string;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Billing
export enum BillingStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  SENT = 'sent',
  PAID = 'paid',
}

export interface IBilling extends Document {
  _id: Types.ObjectId;
  billNumber: string;
  tripSheet: Types.ObjectId | ITripSheet;
  customerName: string;
  customerAddress: string;
  customerGST?: string;
  billDate: Date;

  // Charges
  vehicleCharges: number;
  driverAllowance: number;
  tollCharges: number;
  parkingCharges: number;
  otherCharges: number;

  // Calculations
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;

  status: BillingStatus;
  paidDate?: Date;
  paymentMethod?: string;
  remarks?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Form Input Types (for React Hook Form)
export interface LoginFormInput {
  email: string;
  password: string;
}

export interface VehicleFormInput {
  vehicleNumber: string;
  vehicleType: string;
  model: string;
  make: string;
  year: number;
  capacity: number;
  isActive: boolean;
}

export interface VehicleTypeFormInput {
  name: string;
  baseRate: number;
  perKmRate: number;
  perHourRate: number;
  driverAllowancePerDay: number;
  isActive: boolean;
}

export interface DriverFormInput {
  name: string;
  email: string;
  password?: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface TripSheetFormInput {
  driver: string;
  vehicle: string;
  startDate: Date;
  endDate: Date;
  startingKm: number;
  closingKm: number;
  guestName: string;
  guestMobile: string;
  guestAddress: string;
  purpose: string;
  places: string[];
  tollCharges: number;
  parkingCharges: number;
  otherCharges: number;
  remarks?: string;
}

export interface BillingFormInput {
  tripSheet: string;
  customerName: string;
  customerAddress: string;
  customerGST?: string;
  billDate: Date;
  gstPercentage: number;
  remarks?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Statistics
export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingTrips: number;
  completedTrips: number;
  totalRevenue: number;
  pendingBills: number;
}

// Export Types
export interface ExportOptions {
  format: 'excel' | 'pdf';
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  vehicleId?: string;
  driverId?: string;
}
