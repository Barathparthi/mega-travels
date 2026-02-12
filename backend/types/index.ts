import { Document, Types } from 'mongoose';

// Enums
export enum VehicleTypeCode {
  DZIRE = 'DZIRE',
  BOLERO = 'BOLERO',
  CRYSTA = 'CRYSTA',
}

export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum DayType {
  WORKING = 'working',
  SUNDAY = 'sunday',
  SATURDAY = 'saturday',
}

export enum EntryStatus {
  WORKING = 'working',
  OFF = 'off',
  PENDING = 'pending',
}

export enum TripsheetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
}

export enum BillingStatus {
  GENERATED = 'generated',
  SENT = 'sent',
  PAID = 'paid',
}

// Billing Rules Interface
export interface IBillingRules {
  baseAmount: number;
  baseDays: number;
  extraDayRate: number;
  baseKms: number;
  extraKmRate: number;
  baseHoursPerDay: number;
  extraHourRate: number;
}

// Vehicle Type
export interface IVehicleType extends Document {
  _id: Types.ObjectId;
  name: string;
  code: VehicleTypeCode;
  billingRules: IBillingRules;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  assignedVehicleId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Vehicle
export interface IVehicle extends Document {
  _id: Types.ObjectId;
  vehicleNumber: string;
  vehicleTypeId: Types.ObjectId | IVehicleType;
  assignedDriverId?: Types.ObjectId | IUser;
  routeName?: string;
  driverPassengers?: string; // Add this line
  description?: string;
  currentOdometer: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Tripsheet Entry
export interface ITripsheetEntry {
  date: Date;
  dayOfWeek: string;
  dayType: DayType;
  status: EntryStatus;
  startingKm?: number;
  closingKm?: number;
  totalKm?: number;
  startingTime?: string;
  closingTime?: string;
  totalHours?: number;
  extraHours?: number;
  driverExtraHours?: number;
  fuelLitres?: number;
  fuelAmount?: number;
  remarks?: string;
}

// Tripsheet Summary
export interface ITripsheetSummary {
  totalWorkingDays: number;
  totalOffDays: number;
  totalPendingDays: number;
  totalKms: number;
  totalHours: number;
  totalExtraHours: number;
  totalDriverExtraHours: number;
  totalFuelLitres: number;
  totalFuelAmount: number;
}

// Tripsheet
export interface ITripsheet extends Document {
  _id: Types.ObjectId;
  tripsheetNumber: string;
  vehicleId: Types.ObjectId | IVehicle;
  driverId: Types.ObjectId | IUser;
  month: number;
  year: number;
  entries: ITripsheetEntry[];
  summary: ITripsheetSummary;
  status: TripsheetStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId | IUser;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId | IUser;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Billing Calculation
export interface IBillingCalculation {
  totalWorkingDays: number;
  baseDays: number;
  extraDays: number;
  baseAmount: number;
  extraDayRate: number;
  extraDaysAmount: number;
  totalKms: number;
  baseKms: number;
  extraKms: number;
  extraKmRate: number;
  extraKmsAmount: number;
  totalHours: number;
  baseHoursPerDay: number;
  totalBaseHours: number;
  totalExtraHours: number;
  extraHourRate: number;
  extraHoursAmount: number;
  subTotal: number;
  adjustments: number;
  totalAmount: number;
  amountInWords: string;
}

// Billing
export interface IBilling extends Document {
  _id: Types.ObjectId;
  billNumber: string;
  tripsheetId: Types.ObjectId | ITripsheet;
  vehicleId: Types.ObjectId | IVehicle;
  driverId: Types.ObjectId | IUser;
  vehicleTypeId: Types.ObjectId | IVehicleType;
  month: number;
  year: number;
  calculation: IBillingCalculation;
  status: BillingStatus;
  sentAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Form Input Types
export interface LoginFormInput {
  email: string;
  password: string;
}

export interface VehicleFormInput {
  vehicleNumber: string;
  vehicleTypeId: string;
  routeName?: string;
  description?: string;
}

export interface UserFormInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  licenseNumber?: string;
}

export interface TripEntryFormInput {
  date: Date;
  status: EntryStatus;
  startingKm?: number;
  closingKm?: number;
  startingTime?: string;
  closingTime?: string;
  fuelLitres?: number;
  fuelAmount?: number;
  remarks?: string;
}

// Driver Salary Calculation
export interface IDriverSalaryCalculation {
  totalWorkingDays: number;
  baseDays: number;
  extraDays: number;
  baseSalary: number;
  extraDayRate: number;
  extraDaysAmount: number;
  totalHours: number;
  totalDriverExtraHours: number;
  extraHourRate: number;
  extraHoursAmount: number;
  totalSalary: number;
  advanceDeduction?: number; // Amount deducted for advance salary
  amountInWords: string;
}

// Driver Salary Status
export enum DriverSalaryStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  PAID = 'paid',
}

// Driver Salary
export interface IDriverSalary extends Document {
  _id: Types.ObjectId;
  salaryId: string;
  driverId: Types.ObjectId | IUser;
  vehicleId: Types.ObjectId | IVehicle;
  tripsheetId: Types.ObjectId | ITripsheet;
  month: number;
  year: number;
  calculation: IDriverSalaryCalculation;
  status: DriverSalaryStatus;
  paidAt?: Date;
  paidBy?: Types.ObjectId | IUser;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Advance Salary Types
export enum AdvanceSalaryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  DEDUCTED = 'deducted',
}

export interface IAdvanceSalary extends Document {
  _id: Types.ObjectId;
  advanceId: string;
  driverId: Types.ObjectId | IUser;
  vehicleId: Types.ObjectId | IVehicle;
  amount: number;
  requestedDate: Date;
  requestedMonth: number;
  requestedYear: number;
  reason?: string;
  status: AdvanceSalaryStatus;
  approvedBy?: Types.ObjectId | IUser;
  approvedAt?: Date;
  paidAt?: Date;
  paidBy?: Types.ObjectId | IUser;
  deductedFromSalaryId?: Types.ObjectId;
  deductedAt?: Date;
  rejectedBy?: Types.ObjectId | IUser;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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

// Admin Tripsheet Stats
export interface ITripsheetStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
}

// Admin Tripsheet Filters
export interface ITripsheetFilters {
  month?: number;
  year?: number;
  status?: 'all' | 'draft' | 'submitted' | 'approved';
  vehicleId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Driver Salary Stats
export interface IDriverSalaryStats {
  total: number;
  pending: number;
  generated: number;
  paid: number;
  totalSalaryAmount: number;
}

// Driver Salary Filters
export interface IDriverSalaryFilters {
  month?: number;
  year?: number;
  status?: 'all' | 'pending' | 'generated' | 'paid';
  search?: string;
  page?: number;
  limit?: number;
}

// Fuel Expense Interfaces
export interface IFuelEntry {
  date: Date;
  litres: number;
  amount: number;
  ratePerLitre: number;
  odometer: number;
  kmSinceLast?: number;
  mileage?: number;
}

export interface IVehicleFuelSummary {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleTypeCode: VehicleTypeCode;
  driverName: string;
  totalKm: number;
  totalLitres: number;
  totalAmount: number;
  averageMileage: number;
  averageRatePerLitre: number;
  trend: 'up' | 'down' | 'stable';
  mileageHealth: 'good' | 'average' | 'poor';
}

export interface IFuelSummaryStats {
  totalLitres: number;
  totalAmount: number;
  averageRatePerLitre: number;
  averageMileage: number;
  vehicleCount: number;
}

export interface IFuelFilters {
  month?: number;
  year?: number;
  vehicleId?: string;
}

// Reports & Analytics Interfaces

export interface IMonthlyReportStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalTrips: number;
  totalKms: number;
  totalFuelCost: number;
  totalSalaries: number;
  averageRevenuePerTrip: number;
  profitMargin: number;
}

export interface IVehicleTypeBreakdown {
  vehicleType: string;
  vehicleTypeCode: VehicleTypeCode;
  tripCount: number;
  totalKms: number;
  revenue: number;
  fuelCost: number;
  percentage: number;
}

export interface IMonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  trips: number;
}

export interface IMonthlyReport {
  stats: IMonthlyReportStats;
  vehicleTypeBreakdown: IVehicleTypeBreakdown[];
  monthlyTrends: IMonthlyTrend[];
  topVehicles: {
    vehicleNumber: string;
    revenue: number;
    trips: number;
    kms: number;
  }[];
  topDrivers: {
    driverName: string;
    trips: number;
    revenue: number;
  }[];
}

export interface IVehiclePerformance {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  monthlyData: {
    month: string;
    trips: number;
    kms: number;
    revenue: number;
    fuelCost: number;
    utilization: number;
  }[];
  totalStats: {
    totalTrips: number;
    totalKms: number;
    totalRevenue: number;
    totalFuelCost: number;
    averageUtilization: number;
    profitability: number;
  };
}

export interface IDriverPerformance {
  driverId: string;
  driverName: string;
  monthlyData: {
    month: string;
    trips: number;
    kms: number;
    revenue: number;
    salary: number;
    bonus: number;
  }[];
  totalStats: {
    totalTrips: number;
    totalKms: number;
    totalRevenue: number;
    totalSalary: number;
    totalBonus: number;
    averageRating: number;
  };
}

export interface IBillingBreakdown {
  month: string;
  year: number;
  totalAmount: number;
  componentBreakdown: {
    baseFare: number;
    kmCharges: number;
    driverBata: number;
    nightHalt: number;
    additionalHours: number;
    additionalKms: number;
  };
  byVehicleType: {
    vehicleType: string;
    amount: number;
    percentage: number;
  }[];
  paymentStatus: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

export interface IReportFilters {
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  vehicleId?: string;
  driverId?: string;
}
