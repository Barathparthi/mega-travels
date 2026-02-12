import mongoose, { Schema, models } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import { IUser, UserRole } from '../types';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: '{VALUE} is not a valid role',
      },
      default: UserRole.DRIVER,
    },
    assignedVehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
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
// Note: email index is created automatically by unique: true
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ assignedVehicleId: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return;
  }

  // Hash password with 10 rounds
  this.password = await hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

const User = models.User || mongoose.model<IUser>('User', userSchema);

export default User;
