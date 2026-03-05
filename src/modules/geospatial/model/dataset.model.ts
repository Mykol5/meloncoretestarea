import { Schema, model, Types } from 'mongoose';
import { DataSourceType, DatasetStatus } from 'src/libs/constants';

export interface ColumnMappings {
  latitude: string;
  longitude: string;
  label?: string;
  region?: string;
  sector?: string;
  status?: string;
  beneficiaries?: string;
  impactScore?: string;
  coverage?: string;
}

export interface Dataset {
  _id?: string;
  name: string;
  description?: string;
  entity: Types.ObjectId;
  fileName: string;
  filePath: string;
  fileSize: number;
  rowCount: number;
  validPointsCount: number;
  columnMappings: ColumnMappings;
  sourceType: DataSourceType;
  status: DatasetStatus;
  metadata: {
    originalHeaders?: string[];
    processedAt?: Date;
    errorDetails?: string[];
    statistics?: {
      totalRows: number;
      validCoordinates: number;
      invalidCoordinates: number;
      duplicates: number;
    };
    geoBounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    [key: string]: any;
  };
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
}

const ColumnMappingsSchema = new Schema(
  {
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    label: { type: String },
    region: { type: String },
    sector: { type: String },
    status: { type: String },
    beneficiaries: { type: String },
    impactScore: { type: String },
    coverage: { type: String },
  },
  { _id: false },
);

class DatasetModel {
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
      entity: {
        type: Schema.Types.ObjectId,
        ref: 'EntityConfiguration',
        required: true,
        index: true,
      },
      fileName: {
        type: String,
        required: true,
        maxlength: 255,
      },
      filePath: {
        type: String,
        required: true,
        maxlength: 500,
      },
      fileSize: {
        type: Number,
        required: true,
        min: 0,
      },
      rowCount: {
        type: Number,
        required: true,
        min: 0,
      },
      validPointsCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      columnMappings: {
        type: ColumnMappingsSchema,
        required: true,
      },
      sourceType: {
        type: String,
        enum: Object.values(DataSourceType),
        default: DataSourceType.CSV_IMPORT,
        index: true,
      },
      status: {
        type: String,
        enum: Object.values(DatasetStatus),
        default: DatasetStatus.PROCESSING,
        index: true,
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
      },
      lastAccessedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    },
  );

  // Indexes for performance
  static {
    DatasetModel.schema.index({ entity: 1, status: 1 });
    DatasetModel.schema.index({ entity: 1, sourceType: 1 });
    DatasetModel.schema.index({ entity: 1, createdAt: -1 });
    DatasetModel.schema.index({ entity: 1, name: 'text', description: 'text' });
  }

  // Virtual for file URL (using cloud storage later)
  static {
    DatasetModel.schema.virtual('fileUrl').get(function (this: Dataset) {
      if (this.filePath.startsWith('http')) {
        return this.filePath;
      }
      // For local files, return relative path
      return `/uploads/geospatial/${this.filePath}`;
    });
  }

  // Instance methods
  static {
    DatasetModel.schema.methods.updateLastAccessed = function () {
      this.lastAccessedAt = new Date();
      return this.save();
    };

    DatasetModel.schema.methods.updateStatistics = function (stats: any) {
      this.metadata = {
        ...this.metadata,
        statistics: stats,
        lastUpdated: new Date(),
      };
      return this.save();
    };

    DatasetModel.schema.methods.markAsReady = function (
      validPointsCount: number,
    ) {
      this.status = DatasetStatus.READY;
      this.validPointsCount = validPointsCount;
      this.metadata = {
        ...this.metadata,
        processedAt: new Date(),
      };
      return this.save();
    };

    DatasetModel.schema.methods.markAsError = function (
      errorDetails: string[],
    ) {
      this.status = DatasetStatus.ERROR;
      this.metadata = {
        ...this.metadata,
        errorDetails,
        processedAt: new Date(),
      };
      return this.save();
    };
  }

  // Static methods
  static {
    DatasetModel.schema.statics.findByEntity = function (entityId: string) {
      return this.find({ entity: entityId }).sort({ createdAt: -1 });
    };

    DatasetModel.schema.statics.findReadyDatasets = function (
      entityId: string,
    ) {
      return this.find({
        entity: entityId,
        status: DatasetStatus.READY,
      }).sort({ createdAt: -1 });
    };

    DatasetModel.schema.statics.getEntityStatistics = function (
      entityId: string,
    ) {
      return this.aggregate([
        { $match: { entity: new Types.ObjectId(entityId) } },
        {
          $group: {
            _id: null,
            totalDatasets: { $sum: 1 },
            totalDataPoints: { $sum: '$validPointsCount' },
            processingDatasets: {
              $sum: {
                $cond: [{ $eq: ['$status', DatasetStatus.PROCESSING] }, 1, 0],
              },
            },
            readyDatasets: {
              $sum: {
                $cond: [{ $eq: ['$status', DatasetStatus.READY] }, 1, 0],
              },
            },
            errorDatasets: {
              $sum: {
                $cond: [{ $eq: ['$status', DatasetStatus.ERROR] }, 1, 0],
              },
            },
            totalFileSize: { $sum: '$fileSize' },
            avgRowCount: { $avg: '$rowCount' },
          },
        },
      ]);
    };
  }

  public static model = model<Dataset>('Dataset', DatasetModel.schema);
}

export default DatasetModel;
