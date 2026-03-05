import { Document, Schema, model, Types } from 'mongoose';
import { ReportStatus, ReportCategory, QuestionType } from 'src/libs/constants';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  settings?: any;
  impactMetricId?: Types.ObjectId;
}

export interface Report extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  category?: ReportCategory;
  organization: Types.ObjectId;
  status: ReportStatus;
  allowMultipleResponses: boolean;
  collectEmail: boolean;
  isPublic: boolean;
  questions: Question[];
  shareToken?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  responseCount: number;
  lastResponseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(QuestionType),
    },
    title: { type: String, required: true, maxlength: 500 },
    description: { type: String, maxlength: 1000 },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    settings: { type: Schema.Types.Mixed },
    impactMetricId: {
      type: Schema.Types.ObjectId,
      ref: 'ImpactMetric',
      required: function () {
        return this.type === QuestionType.IMPACT_METRIC;
      },
    },
  },
  { _id: false },
);

const ReportSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: Object.values(ReportCategory),
      default: ReportCategory.IMPACT_ASSESSMENT,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.DRAFT,
      index: true,
    },
    allowMultipleResponses: { type: Boolean, default: false },
    collectEmail: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false, index: true },
    questions: [QuestionSchema],
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
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
    responseCount: { type: Number, default: 0 },
    lastResponseAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

ReportSchema.index({ organization: 1, status: 1 });
ReportSchema.index({ organization: 1, category: 1 });
ReportSchema.index({ shareToken: 1 });
ReportSchema.index({ title: 'text', description: 'text' });

export const ReportModel = model<Report>('Report', ReportSchema);

class ReportsModel {
  public static schema: Schema = ReportSchema;
  public static model = ReportModel;
}

export default ReportsModel;
