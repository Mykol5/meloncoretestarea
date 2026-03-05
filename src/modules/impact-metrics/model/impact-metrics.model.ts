import { Document, Schema, model, Types } from 'mongoose';
import { TrackingStatus, MetricType } from 'src/libs/constants';

export interface ImpactMetric extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  target: number;
  metricType: MetricType;
  startDate: Date;
  endDate: Date;
  scoringWeight: number;
  trackingStatus: TrackingStatus;
  actualValue?: number;
  progressPercentage?: number;
  organization: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ImpactMetricSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    target: {
      type: Number,
      required: true,
      min: 0,
    },
    metricType: {
      type: String,
      enum: Object.values(MetricType),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    scoringWeight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    trackingStatus: {
      type: String,
      enum: Object.values(TrackingStatus),
      default: TrackingStatus.ON_TRACK,
      index: true,
    },
    actualValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      min: 0,
      default: 0,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ImpactMetricModel = model<ImpactMetric>(
  'ImpactMetric',
  ImpactMetricSchema,
);

class ImpactMetricsModel {
  public static schema: Schema = ImpactMetricSchema;
  public static model = ImpactMetricModel;
}

export default ImpactMetricsModel;
