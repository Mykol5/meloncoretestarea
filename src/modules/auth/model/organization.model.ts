import { Document, Schema, model, Types } from 'mongoose';
import { OrganizationStatus, PlanType } from 'src/libs/constants';

export interface Organization extends Document {
  _id: Types.ObjectId;
  name: string;
  domain: string;
  allowedDomains: string[];
  plan: PlanType;
  status: OrganizationStatus;
  userCount: number;
  userLimit: number;
  trialEndsAt?: Date;
  billingEmail?: string;
  stripeCustomerId?: string;
  settings: any;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    allowedDomains: [
      {
        type: String,
        lowercase: true,
      },
    ],
    plan: {
      type: String,
      enum: Object.values(PlanType),
      default: PlanType.TRIAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrganizationStatus),
      default: OrganizationStatus.TRIAL,
      index: true,
    },
    userCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userLimit: {
      type: Number,
      default: 1,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
    billingEmail: {
      type: String,
      lowercase: true,
    },
    stripeCustomerId: String,
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    features: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance
OrganizationSchema.index({ domain: 1 });
OrganizationSchema.index({ plan: 1, status: 1 });

export const OrganizationModel = model<Organization>(
  'Organization',
  OrganizationSchema,
);
