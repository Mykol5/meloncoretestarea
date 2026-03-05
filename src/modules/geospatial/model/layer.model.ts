import { Schema, model, Types } from 'mongoose';
import { LayerType, DEFAULT_STYLING } from 'src/libs/constants';

export interface LayerStyling {
  color: string;
  opacity: number;
  radius?: number;
  metric?: string;
  colorScale?: string;
  clusterRadius?: number;
  strokeWidth?: number;
  fillOpacity?: number;
}

export interface Layer {
  _id?: string;
  name: string;
  description?: string;
  entity: Types.ObjectId;
  type: LayerType;
  datasetId: Types.ObjectId;
  visible: boolean;
  styling: LayerStyling;
  filterConfig?: {
    sectors?: string[];
    regions?: string[];
    status?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    metricRange?: {
      field: string;
      min: number;
      max: number;
    };
    customFilters?: any;
  };
  zIndex: number;
  metadata: {
    pointCount?: number;
    lastRendered?: Date;
    bounds?: {
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

const LayerStylingSchema = new Schema(
  {
    color: {
      type: String,
      default: DEFAULT_STYLING.COLOR,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    },
    opacity: {
      type: Number,
      default: DEFAULT_STYLING.OPACITY,
      min: 0,
      max: 1,
    },
    radius: {
      type: Number,
      default: DEFAULT_STYLING.RADIUS,
      min: 1,
      max: 100,
    },
    metric: { type: String },
    colorScale: {
      type: String,
      enum: ['sequential', 'diverging', 'categorical'],
      default: 'sequential',
    },
    clusterRadius: {
      type: Number,
      default: DEFAULT_STYLING.CLUSTER_RADIUS,
      min: 10,
      max: 200,
    },
    strokeWidth: {
      type: Number,
      default: 2,
      min: 0,
      max: 10,
    },
    fillOpacity: {
      type: Number,
      default: 0.6,
      min: 0,
      max: 1,
    },
  },
  { _id: false },
);

const FilterConfigSchema = new Schema(
  {
    sectors: [{ type: String }],
    regions: [{ type: String }],
    status: [{ type: String }],
    dateRange: {
      start: { type: Date },
      end: { type: Date },
    },
    metricRange: {
      field: { type: String },
      min: { type: Number },
      max: { type: Number },
    },
    customFilters: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

class LayerModel {
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
        maxlength: 500,
      },
      entity: {
        type: Schema.Types.ObjectId,
        ref: 'EntityConfiguration',
        required: true,
        index: true,
      },
      type: {
        type: String,
        enum: Object.values(LayerType),
        required: true,
        index: true,
      },
      datasetId: {
        type: Schema.Types.ObjectId,
        ref: 'Dataset',
        required: true,
        index: true,
      },
      visible: {
        type: Boolean,
        default: true,
        index: true,
      },
      styling: {
        type: LayerStylingSchema,
        default: () => ({
          color: DEFAULT_STYLING.COLOR,
          opacity: DEFAULT_STYLING.OPACITY,
          radius: DEFAULT_STYLING.RADIUS,
          clusterRadius: DEFAULT_STYLING.CLUSTER_RADIUS,
        }),
      },
      filterConfig: {
        type: FilterConfigSchema,
        default: {},
      },
      zIndex: {
        type: Number,
        default: 0,
        min: 0,
        max: 20,
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

  // Compound indexes for performance
  static {
    LayerModel.schema.index({ entity: 1, visible: 1 });
    LayerModel.schema.index({ entity: 1, type: 1 });
    LayerModel.schema.index({ entity: 1, datasetId: 1 });
    LayerModel.schema.index({ entity: 1, zIndex: 1 });
    LayerModel.schema.index({ entity: 1, createdAt: -1 });
    LayerModel.schema.index({ entity: 1, name: 'text', description: 'text' });
  }

  // Virtual for dataset population
  static {
    LayerModel.schema.virtual('dataset', {
      ref: 'Dataset',
      localField: 'datasetId',
      foreignField: '_id',
      justOne: true,
    });
  }

  // Instance methods
  static {
    LayerModel.schema.methods.updateLastAccessed = function () {
      this.lastAccessedAt = new Date();
      return this.save();
    };

    LayerModel.schema.methods.updatePointCount = function (count: number) {
      this.metadata = {
        ...this.metadata,
        pointCount: count,
        lastRendered: new Date(),
      };
      return this.save();
    };

    LayerModel.schema.methods.updateBounds = function (bounds: any) {
      this.metadata = {
        ...this.metadata,
        bounds,
        lastUpdated: new Date(),
      };
      return this.save();
    };

    LayerModel.schema.methods.toggleVisibility = function () {
      this.visible = !this.visible;
      this.lastAccessedAt = new Date();
      return this.save();
    };

    LayerModel.schema.methods.updateStyling = function (
      newStyling: Partial<LayerStyling>,
    ) {
      this.styling = {
        ...this.styling,
        ...newStyling,
      };
      this.updatedBy = this.updatedBy; // Will be set by service
      return this.save();
    };

    LayerModel.schema.methods.applyFilter = function (filterConfig: any) {
      this.filterConfig = {
        ...this.filterConfig,
        ...filterConfig,
      };
      this.updatedBy = this.updatedBy; // Will be set by service
      return this.save();
    };
  }

  // Static methods
  static {
    LayerModel.schema.statics.findByEntity = function (entityId: string) {
      return this.find({ entity: entityId })
        .populate('dataset', 'name status validPointsCount')
        .sort({ zIndex: -1, createdAt: -1 });
    };

    LayerModel.schema.statics.findVisibleLayers = function (entityId: string) {
      return this.find({
        entity: entityId,
        visible: true,
      })
        .populate('dataset', 'name status validPointsCount')
        .sort({ zIndex: -1, createdAt: -1 });
    };

    LayerModel.schema.statics.findByDataset = function (datasetId: string) {
      return this.find({ datasetId })
        .populate('dataset', 'name status validPointsCount')
        .sort({ zIndex: -1, createdAt: -1 });
    };

    LayerModel.schema.statics.getEntityStatistics = function (
      entityId: string,
    ) {
      return this.aggregate([
        { $match: { entity: new Types.ObjectId(entityId) } },
        {
          $group: {
            _id: null,
            totalLayers: { $sum: 1 },
            visibleLayers: {
              $sum: { $cond: [{ $eq: ['$visible', true] }, 1, 0] },
            },
            layersByType: {
              $push: '$type',
            },
          },
        },
        {
          $addFields: {
            typeDistribution: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$layersByType', []] },
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      $size: {
                        $filter: {
                          input: '$layersByType',
                          cond: { $eq: ['$$this', '$$type'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);
    };

    LayerModel.schema.statics.reorderLayers = function (
      entityId: string,
      layerOrders: { layerId: string; zIndex: number }[],
    ) {
      const bulkOps = layerOrders.map(({ layerId, zIndex }) => ({
        updateOne: {
          filter: { _id: layerId, entity: entityId },
          update: { zIndex, updatedAt: new Date() },
        },
      }));

      return this.bulkWrite(bulkOps);
    };
  }

  public static model = model<Layer>('Layer', LayerModel.schema);
}

export default LayerModel;
