import { Schema, model, Types } from 'mongoose';
import { ChartType, AggregationType, ChartStatus } from 'src/libs/constants';

export interface ChartFilter {
  column: string;
  operator: string;
  value: any;
}

export interface ChartStyling {
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
}

export interface Chart {
  _id?: string;
  name: string;
  description?: string;
  type: ChartType;
  dataSourceId: Types.ObjectId;
  entity: Types.ObjectId;
  xAxis: string;
  yAxis?: string;
  groupBy?: string;
  aggregation: AggregationType;
  filters: ChartFilter[];
  styling: ChartStyling;
  status: ChartStatus;
  isShared: boolean;
  shareToken?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChartFilterSchema = new Schema(
  {
    column: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const ChartStylingSchema = new Schema(
  {
    colors: [{ type: String }],
    showLegend: { type: Boolean, default: true },
    showGrid: { type: Boolean, default: true },
    title: { type: String, maxlength: 200 },
    subtitle: { type: String, maxlength: 500 },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false },
);

class ChartModel {
  private static schema: Schema = new Schema(
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
      type: {
        type: String,
        required: true,
        enum: Object.values(ChartType),
        index: true,
      },
      dataSourceId: {
        type: Schema.Types.ObjectId,
        ref: 'DataSource',
        required: true,
        index: true,
      },
      entity: {
        type: Schema.Types.ObjectId,
        ref: 'EntityConfiguration',
        required: true,
        index: true,
      },
      xAxis: {
        type: String,
        required: true,
      },
      yAxis: {
        type: String,
      },
      groupBy: {
        type: String,
      },
      aggregation: {
        type: String,
        required: true,
        enum: Object.values(AggregationType),
      },
      filters: [ChartFilterSchema],
      styling: {
        type: ChartStylingSchema,
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(ChartStatus),
        default: ChartStatus.DRAFT,
        index: true,
      },
      isShared: {
        type: Boolean,
        default: false,
        index: true,
      },
      shareToken: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
      },
    },
    {
      timestamps: true,
    },
  );

  public static model = model<Chart>('Chart', ChartModel.schema);
}

export default ChartModel;
