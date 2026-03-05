import { Document, Schema, model, Types } from 'mongoose';
import { UserRole, UserStatus } from 'src/libs/constants';

export interface User extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  password?: string;
  organization: Types.ObjectId;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  invitedBy?: Types.ObjectId;
  invitedAt?: Date;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    username: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      sparse: true,
    },
    password: {
      type: String,
      select: false, // Don't include by default
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: Date,
    lastLoginAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.resetPasswordToken;
        return ret;
      },
    },
  },
);

// Compound indexes for performance
UserSchema.index({ organization: 1, status: 1 });
UserSchema.index({ email: 1, organization: 1 });

export const UserModel = model<User>('User', UserSchema);
