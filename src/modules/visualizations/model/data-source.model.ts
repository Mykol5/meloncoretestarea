import { Schema, model, Types } from 'mongoose';
import {
  DataSourceType,
  DataSourceStatus,
  ColumnDataType,
} from 'src/libs/constants';

export interface ColumnMapping {
  name: string;
  type: ColumnDataType;
  displayName?: string;
  nullable: boolean;
  unique: boolean;
}

export interface DataSource {
  _id?: string;
  name: string;
  description?: string;
  type: DataSourceType;
  fileName?: string;
  filePath?: string;
  reportId?: Types.ObjectId;
  entity: Types.ObjectId;
  columns: ColumnMapping[];
  rowCount: number;
  status: DataSourceStatus;
  metadata?: Record<string, any>;
  preview?: Record<string, any>[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ColumnMappingSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(ColumnDataType),
    },
    displayName: { type: String },
    nullable: { type: Boolean, default: false },
    unique: { type: Boolean, default: false },
  },
  { _id: false },
);

class DataSourceModel {
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
        enum: Object.values(DataSourceType),
        index: true,
      },
      fileName: {
        type: String,
        maxlength: 255,
      },
      filePath: {
        type: String,
        maxlength: 500,
      },
      reportId: {
        type: Schema.Types.ObjectId,
        ref: 'Report',
        index: true,
      },
      entity: {
        type: Schema.Types.ObjectId,
        ref: 'EntityConfiguration',
        required: true,
        index: true,
      },
      columns: [ColumnMappingSchema],
      rowCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: Object.values(DataSourceStatus),
        default: DataSourceStatus.PROCESSING,
        index: true,
      },
      metadata: {
        type: Schema.Types.Mixed,
      },
      preview: [Schema.Types.Mixed],
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

  public static model = model<DataSource>('DataSource', DataSourceModel.schema);
}

export default DataSourceModel;
