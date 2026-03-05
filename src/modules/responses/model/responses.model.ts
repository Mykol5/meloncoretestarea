import { Schema, model, Types } from 'mongoose';

export interface QuestionResponse {
  questionId: string;
  answer?: any;
  impactMetricId?: Types.ObjectId;
  actualValue?: number;
}

export interface Response {
  _id?: string;
  reportId: Types.ObjectId;
  respondentEmail?: string;
  respondentName?: string;
  responses: QuestionResponse[];
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const QuestionResponseSchema = new Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed },
    impactMetricId: {
      type: Schema.Types.ObjectId,
      ref: 'ImpactMetric',
    },
    actualValue: { type: Number },
  },
  { _id: false },
);

class ResponsesModel {
  private static schema: Schema = new Schema(
    {
      reportId: {
        type: Schema.Types.ObjectId,
        ref: 'Report',
        required: true,
        index: true,
      },
      respondentEmail: {
        type: String,
        index: true,
      },
      respondentName: {
        type: String,
      },
      responses: [QuestionResponseSchema],
      submittedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
      ipAddress: { type: String },
      userAgent: { type: String },
    },
    {
      timestamps: true,
    },
  );

  public static model = model<Response>('Response', ResponsesModel.schema);
}

export default ResponsesModel;
