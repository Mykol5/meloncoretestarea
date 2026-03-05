import { Schema, model, Types } from 'mongoose';
import {
  DataSourceType,
  GeospatialSector,
  COORDINATE_VALIDATION,
} from 'src/libs/constants';

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface DataPointProperties {
  label?: string;
  region?: string;
  sector?: GeospatialSector;
  status?: string;
  beneficiaries?: number;
  impactScore?: number;
  coverage?: number;
  activeAgents?: number;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  [key: string]: any;
}

export interface DataPoint {
  _id?: string;
  datasetId: Types.ObjectId;
  entity: Types.ObjectId;
  coordinates: Coordinates;
  properties: DataPointProperties;
  sourceId?: string; // For integration with reports/projects
  sourceType: DataSourceType;
  rawData: any; // Original CSV row data
  metadata: {
    originalRowIndex?: number;
    validationErrors?: string[];
    geocoded?: boolean;
    qualityScore?: number;
    lastUpdated?: Date;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CoordinatesSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: COORDINATE_VALIDATION.LAT_MIN,
      max: COORDINATE_VALIDATION.LAT_MAX,
      index: '2dsphere',
    },
    longitude: {
      type: Number,
      required: true,
      min: COORDINATE_VALIDATION.LNG_MIN,
      max: COORDINATE_VALIDATION.LNG_MAX,
      index: '2dsphere',
    },
    altitude: {
      type: Number,
      min: -1000,
      max: 10000,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1000,
    },
  },
  { _id: false },
);

const ContactInfoSchema = new Schema(
  {
    name: { type: String, maxlength: 100 },
    phone: { type: String, maxlength: 20 },
    email: {
      type: String,
      maxlength: 100,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  { _id: false },
);

const PropertiesSchema = new Schema(
  {
    label: { type: String, maxlength: 500 },
    region: { type: String, maxlength: 100, index: true },
    sector: {
      type: String,
      enum: Object.values(GeospatialSector),
      default: GeospatialSector.OTHER,
      index: true,
    },
    status: {
      type: String,
      maxlength: 50,
      index: true,
    },
    beneficiaries: {
      type: Number,
      min: 0,
      max: 10000000,
    },
    impactScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    coverage: {
      type: Number,
      min: 0,
      max: 1000,
    },
    activeAgents: {
      type: Number,
      min: 0,
      max: 1000,
    },
    budget: {
      type: Number,
      min: 0,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, maxlength: 2000 },
    contactInfo: { type: ContactInfoSchema },
  },
  { _id: false, strict: false },
);

class DataPointModel {
  private static schema: Schema = new Schema(
    {
      datasetId: {
        type: Schema.Types.ObjectId,
        ref: 'Dataset',
        required: true,
        index: true,
      },
      entity: {
        type: Schema.Types.ObjectId,
        ref: 'EntityConfiguration',
        required: true,
        index: true,
      },
      coordinates: {
        type: CoordinatesSchema,
        required: true,
      },
      properties: {
        type: PropertiesSchema,
        default: {},
      },
      sourceId: {
        type: String,
        maxlength: 100,
        index: true,
      },
      sourceType: {
        type: String,
        enum: Object.values(DataSourceType),
        default: DataSourceType.CSV_IMPORT,
        index: true,
      },
      rawData: {
        type: Schema.Types.Mixed,
        default: {},
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
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

  // Geospatial index for location-based queries
  static {
    DataPointModel.schema.index({
      'coordinates.latitude': 1,
      'coordinates.longitude': 1,
    });

    DataPointModel.schema.index({
      coordinates: '2dsphere',
    });
  }

  // Compound indexes for performance
  static {
    DataPointModel.schema.index({ entity: 1, datasetId: 1 });
    DataPointModel.schema.index({ entity: 1, 'properties.sector': 1 });
    DataPointModel.schema.index({ entity: 1, 'properties.region': 1 });
    DataPointModel.schema.index({ entity: 1, 'properties.status': 1 });
    DataPointModel.schema.index({ entity: 1, sourceType: 1 });
    DataPointModel.schema.index({ entity: 1, isActive: 1 });
    DataPointModel.schema.index({ entity: 1, createdAt: -1 });

    // Text search index
    DataPointModel.schema.index({
      'properties.label': 'text',
      'properties.description': 'text',
      'properties.region': 'text',
    });
  }

  // Virtual for GeoJSON format
  static {
    DataPointModel.schema.virtual('geoJson').get(function (this: DataPoint) {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [this.coordinates.longitude, this.coordinates.latitude],
        },
        properties: {
          id: this._id,
          ...this.properties,
          sourceType: this.sourceType,
          createdAt: this.createdAt,
        },
      };
    });
  }

  // Instance methods
  static {
    DataPointModel.schema.methods.updateCoordinates = function (
      lat: number,
      lng: number,
    ) {
      this.coordinates.latitude = lat;
      this.coordinates.longitude = lng;
      this.metadata = {
        ...this.metadata,
        lastUpdated: new Date(),
        geocoded: true,
      };
      return this.save();
    };

    DataPointModel.schema.methods.updateProperties = function (
      newProperties: Partial<DataPointProperties>,
    ) {
      this.properties = {
        ...this.properties,
        ...newProperties,
      };
      this.metadata = {
        ...this.metadata,
        lastUpdated: new Date(),
      };
      return this.save();
    };

    DataPointModel.schema.methods.calculateQualityScore = function () {
      let score = 0;
      const maxScore = 100;

      // Coordinate accuracy (40 points)
      if (this.coordinates.accuracy && this.coordinates.accuracy <= 10) {
        score += 40;
      } else if (
        this.coordinates.accuracy &&
        this.coordinates.accuracy <= 100
      ) {
        score += 20;
      } else if (this.coordinates.latitude && this.coordinates.longitude) {
        score += 10;
      }

      // Required properties (30 points)
      if (this.properties.label) score += 10;
      if (this.properties.region) score += 10;
      if (
        this.properties.sector &&
        this.properties.sector !== GeospatialSector.OTHER
      )
        score += 10;

      // Optional enrichment (30 points)
      if (this.properties.beneficiaries && this.properties.beneficiaries > 0)
        score += 10;
      if (this.properties.impactScore && this.properties.impactScore > 0)
        score += 10;
      if (this.properties.description) score += 5;
      if (this.properties.contactInfo) score += 5;

      this.metadata = {
        ...this.metadata,
        qualityScore: Math.min(score, maxScore),
        lastQualityCheck: new Date(),
      };

      return score;
    };

    DataPointModel.schema.methods.deactivate = function () {
      this.isActive = false;
      this.metadata = {
        ...this.metadata,
        deactivatedAt: new Date(),
      };
      return this.save();
    };

    DataPointModel.schema.methods.reactivate = function () {
      this.isActive = true;
      this.metadata = {
        ...this.metadata,
        reactivatedAt: new Date(),
        deactivatedAt: undefined,
      };
      return this.save();
    };
  }

  // Static methods
  static {
    DataPointModel.schema.statics.findByDataset = function (datasetId: string) {
      return this.find({ datasetId, isActive: true }).sort({ createdAt: -1 });
    };

    DataPointModel.schema.statics.findByEntity = function (entityId: string) {
      return this.find({ entity: entityId, isActive: true }).sort({
        createdAt: -1,
      });
    };

    DataPointModel.schema.statics.findWithinBounds = function (
      entityId: string,
      bounds: any,
    ) {
      return this.find({
        entity: entityId,
        isActive: true,
        'coordinates.latitude': { $gte: bounds.south, $lte: bounds.north },
        'coordinates.longitude': { $gte: bounds.west, $lte: bounds.east },
      });
    };

    DataPointModel.schema.statics.findNearPoint = function (
      entityId: string,
      lat: number,
      lng: number,
      maxDistance: number,
    ) {
      return this.find({
        entity: entityId,
        isActive: true,
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: maxDistance,
          },
        },
      });
    };

    DataPointModel.schema.statics.aggregateByRegion = function (
      entityId: string,
      metric: string,
    ) {
      return this.aggregate([
        {
          $match: {
            entity: new Types.ObjectId(entityId),
            isActive: true,
            [`properties.${metric}`]: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$properties.region',
            count: { $sum: 1 },
            totalValue: { $sum: `$properties.${metric}` },
            avgValue: { $avg: `$properties.${metric}` },
            minValue: { $min: `$properties.${metric}` },
            maxValue: { $max: `$properties.${metric}` },
          },
        },
        { $sort: { totalValue: -1 } },
      ]);
    };

    DataPointModel.schema.statics.aggregateBySector = function (
      entityId: string,
    ) {
      return this.aggregate([
        {
          $match: {
            entity: new Types.ObjectId(entityId),
            isActive: true,
          },
        },
        {
          $group: {
            _id: '$properties.sector',
            count: { $sum: 1 },
            avgBeneficiaries: { $avg: '$properties.beneficiaries' },
            avgImpactScore: { $avg: '$properties.impactScore' },
          },
        },
        { $sort: { count: -1 } },
      ]);
    };

    DataPointModel.schema.statics.getEntityStatistics = function (
      entityId: string,
    ) {
      return this.aggregate([
        { $match: { entity: new Types.ObjectId(entityId), isActive: true } },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: 1 },
            totalBeneficiaries: { $sum: '$properties.beneficiaries' },
            avgImpactScore: { $avg: '$properties.impactScore' },
            uniqueRegions: { $addToSet: '$properties.region' },
            uniqueSectors: { $addToSet: '$properties.sector' },
            avgQualityScore: { $avg: '$metadata.qualityScore' },
          },
        },
        {
          $addFields: {
            regionCount: { $size: '$uniqueRegions' },
            sectorCount: { $size: '$uniqueSectors' },
          },
        },
      ]);
    };

    DataPointModel.schema.statics.getBounds = function (
      entityId: string,
      datasetIds?: string[],
    ) {
      const matchConditions: any = {
        entity: new Types.ObjectId(entityId),
        isActive: true,
      };

      if (datasetIds && datasetIds.length > 0) {
        matchConditions.datasetId = {
          $in: datasetIds.map((id) => new Types.ObjectId(id)),
        };
      }

      return this.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            north: { $max: '$coordinates.latitude' },
            south: { $min: '$coordinates.latitude' },
            east: { $max: '$coordinates.longitude' },
            west: { $min: '$coordinates.longitude' },
            count: { $sum: 1 },
          },
        },
      ]);
    };

    DataPointModel.schema.statics.bulkInsertPoints = function (
      points: Partial<DataPoint>[],
    ) {
      return this.insertMany(points, { ordered: false });
    };

    DataPointModel.schema.statics.deleteByDataset = function (
      datasetId: string,
    ) {
      return this.deleteMany({ datasetId });
    };
  }

  public static model = model<DataPoint>('DataPoint', DataPointModel.schema);
}

export default DataPointModel;
