import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import LayerModel, { Layer } from '../model/layer.model';

export class LayerRepository extends AbstractRepo<Layer> {
  constructor() {
    super(LayerModel.model);
  }

  async findAll(): Promise<Layer[]> {
    return LayerModel.model.find().exec();
  }

  //   /**
  //    * Find layers by entity with optional pagination
  //    */
  //   async findByEntity(
  //     entityId: string,
  //     options: {
  //       includeDataset?: boolean;
  //       visibleOnly?: boolean;
  //       page?: number;
  //       limit?: number;
  //       sortBy?: string;
  //       sortOrder?: 'asc' | 'desc';
  //     } = {},
  //   ): Promise<Layer[]> {
  //     const {
  //       includeDataset = true,
  //       visibleOnly = false,
  //       page,
  //       limit,
  //       sortBy = 'zIndex',
  //       sortOrder = 'desc',
  //     } = options;

  //     let query = LayerModel.model.find({
  //       entity: new Types.ObjectId(entityId),
  //       ...(visibleOnly && { visible: true }),
  //     });

  //     if (includeDataset) {
  //       query = query.populate(
  //         'dataset',
  //         'name status validPointsCount metadata',
  //       );
  //     }

  //     // Add pagination if specified
  //     if (page && limit) {
  //       const skip = (page - 1) * limit;
  //       query = query.skip(skip).limit(limit);
  //     }

  //     // Add sorting
  //     const sortDirection = sortOrder === 'asc' ? 1 : -1;
  //     if (sortBy === 'zIndex') {
  //       query = query.sort({ zIndex: -sortDirection, createdAt: -1 });
  //     } else {
  //       query = query.sort({ [sortBy]: sortDirection });
  //     }

  //     return query.exec();
  //   }

  //   /**
  //    * Find visible layers for an entity
  //    */
  //   async findVisibleLayers(entityId: string): Promise<Layer[]> {
  //     return LayerModel.model
  //       .find({
  //         entity: new Types.ObjectId(entityId),
  //         visible: true,
  //       })
  //       .populate('dataset', 'name status validPointsCount')
  //       .sort({ zIndex: -1, createdAt: -1 })
  //       .exec();
  //   }

  //   /**
  //    * Find layers by dataset
  //    */
  //   async findByDataset(datasetId: string): Promise<Layer[]> {
  //     return LayerModel.model
  //       .find({ datasetId: new Types.ObjectId(datasetId) })
  //       .populate('dataset', 'name status validPointsCount')
  //       .sort({ zIndex: -1, createdAt: -1 })
  //       .exec();
  //   }

  //   /**
  //    * Find layer by ID and entity (for security)
  //    */
  //   async findByIdAndEntity(
  //     layerId: string,
  //     entityId: string,
  //   ): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findOne({
  //         _id: new Types.ObjectId(layerId),
  //         entity: new Types.ObjectId(entityId),
  //       })
  //       .populate('dataset', 'name status validPointsCount metadata')
  //       .populate('createdBy', 'firstName lastName email')
  //       .populate('updatedBy', 'firstName lastName email')
  //       .exec();
  //   }

  //   /**
  //    * Toggle layer visibility
  //    */
  //   async toggleVisibility(
  //     layerId: string,
  //     entityId: string,
  //   ): Promise<Layer | null> {
  //     const layer = await this.findByIdAndEntity(layerId, entityId);
  //     if (!layer) return null;

  //     return LayerModel.model
  //       .findByIdAndUpdate(
  //         layerId,
  //         {
  //           visible: !layer.visible,
  //           lastAccessedAt: new Date(),
  //           updatedAt: new Date(),
  //         },
  //         { new: true },
  //       )
  //       .populate('dataset', 'name status validPointsCount')
  //       .exec();
  //   }

  //   /**
  //    * Update layer visibility
  //    */
  //   async updateVisibility(
  //     layerId: string,
  //     entityId: string,
  //     visible: boolean,
  //   ): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findOneAndUpdate(
  //         {
  //           _id: new Types.ObjectId(layerId),
  //           entity: new Types.ObjectId(entityId),
  //         },
  //         {
  //           visible,
  //           lastAccessedAt: new Date(),
  //           updatedAt: new Date(),
  //         },
  //         { new: true },
  //       )
  //       .populate('dataset', 'name status validPointsCount')
  //       .exec();
  //   }

  //   /**
  //    * Update layer styling
  //    */
  //   async updateStyling(
  //     layerId: string,
  //     entityId: string,
  //     styling: Partial<LayerStyling>,
  //   ): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findOneAndUpdate(
  //         {
  //           _id: new Types.ObjectId(layerId),
  //           entity: new Types.ObjectId(entityId),
  //         },
  //         {
  //           $set: {
  //             styling: styling,
  //             lastAccessedAt: new Date(),
  //             updatedAt: new Date(),
  //           },
  //         },
  //         { new: true },
  //       )
  //       .populate('dataset', 'name status validPointsCount')
  //       .exec();
  //   }

  //   /**
  //    * Update layer filter configuration
  //    */
  //   async updateFilterConfig(
  //     layerId: string,
  //     entityId: string,
  //     filterConfig: any,
  //   ): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findOneAndUpdate(
  //         {
  //           _id: new Types.ObjectId(layerId),
  //           entity: new Types.ObjectId(entityId),
  //         },
  //         {
  //           filterConfig,
  //           lastAccessedAt: new Date(),
  //           updatedAt: new Date(),
  //         },
  //         { new: true },
  //       )
  //       .populate('dataset', 'name status validPointsCount')
  //       .exec();
  //   }

  //   /**
  //    * Update layer z-index (display order)
  //    */
  //   async updateZIndex(
  //     layerId: string,
  //     entityId: string,
  //     zIndex: number,
  //   ): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findOneAndUpdate(
  //         {
  //           _id: new Types.ObjectId(layerId),
  //           entity: new Types.ObjectId(entityId),
  //         },
  //         {
  //           zIndex,
  //           updatedAt: new Date(),
  //         },
  //         { new: true },
  //       )
  //       .exec();
  //   }

  //   /**
  //    * Reorder layers by updating z-index for multiple layers
  //    */
  //   async reorderLayers(
  //     entityId: string,
  //     layerOrders: { layerId: string; zIndex: number }[],
  //   ): Promise<boolean> {
  //     const bulkOps = layerOrders.map(({ layerId, zIndex }) => ({
  //       updateOne: {
  //         filter: {
  //           _id: new Types.ObjectId(layerId),
  //           entity: new Types.ObjectId(entityId),
  //         },
  //         update: {
  //           zIndex,
  //           updatedAt: new Date(),
  //         },
  //       },
  //     }));

  //     const result = await LayerModel.model.bulkWrite(bulkOps);
  //     return result.modifiedCount === layerOrders.length;
  //   }

  //   /**
  //    * Update layer metadata
  //    */
  //   async updateMetadata(
  //     layerId: string,
  //     entityId: string,
  //     metadata: any,
  //   ): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findOneAndUpdate(
  //         {
  //           _id: new Types.ObjectId(layerId),
  //           entity: new Types.ObjectId(entityId),
  //         },
  //         {
  //           $set: {
  //             metadata: { ...metadata },
  //             updatedAt: new Date(),
  //           },
  //         },
  //         { new: true },
  //       )
  //       .exec();
  //   }

  //   /**
  //    * Update last accessed timestamp
  //    */
  //   async updateLastAccessed(layerId: string): Promise<Layer | null> {
  //     return LayerModel.model
  //       .findByIdAndUpdate(layerId, { lastAccessedAt: new Date() }, { new: true })
  //       .exec();
  //   }

  //   /**
  //    * Get layers by type
  //    */
  //   async findByType(entityId: string, type: LayerType): Promise<Layer[]> {
  //     return LayerModel.model
  //       .find({
  //         entity: new Types.ObjectId(entityId),
  //         type,
  //       })
  //       .populate('dataset', 'name status validPointsCount')
  //       .sort({ zIndex: -1, createdAt: -1 })
  //       .exec();
  //   }

  //   /**
  //    * Search layers by name or description
  //    */
  //   async searchLayers(entityId: string, searchTerm: string): Promise<Layer[]> {
  //     return LayerModel.model
  //       .find({
  //         entity: new Types.ObjectId(entityId),
  //         $or: [
  //           { name: { $regex: searchTerm, $options: 'i' } },
  //           { description: { $regex: searchTerm, $options: 'i' } },
  //         ],
  //       })
  //       .populate('dataset', 'name status validPointsCount')
  //       .sort({ zIndex: -1, createdAt: -1 })
  //       .limit(20)
  //       .exec();
  //   }

  //   /**
  //    * Get entity statistics
  //    */
  //   async getEntityStatistics(entityId: string): Promise<any> {
  //     const stats = await LayerModel.model.aggregate([
  //       { $match: { entity: new Types.ObjectId(entityId) } },
  //       {
  //         $group: {
  //           _id: null,
  //           totalLayers: { $sum: 1 },
  //           visibleLayers: {
  //             $sum: { $cond: [{ $eq: ['$visible', true] }, 1, 0] },
  //           },
  //           hiddenLayers: {
  //             $sum: { $cond: [{ $eq: ['$visible', false] }, 1, 0] },
  //           },
  //           layersByType: {
  //             $push: '$type',
  //           },
  //         },
  //       },
  //       {
  //         $addFields: {
  //           typeDistribution: {
  //             $arrayToObject: {
  //               $map: {
  //                 input: { $setUnion: ['$layersByType', []] },
  //                 as: 'type',
  //                 in: {
  //                   k: '$type',
  //                   v: {
  //                     $size: {
  //                       $filter: {
  //                         input: '$layersByType',
  //                         cond: { $eq: ['$this', '$type'] },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     ]);

  //     return stats.length > 0
  //       ? stats[0]
  //       : {
  //           totalLayers: 0,
  //           visibleLayers: 0,
  //           hiddenLayers: 0,
  //           typeDistribution: {},
  //         };
  //   }

  //   /**
  //    * Get layers with dataset information
  //    */
  //   async getLayersWithDatasetInfo(entityId: string): Promise<any[]> {
  //     return LayerModel.model.aggregate([
  //       { $match: { entity: new Types.ObjectId(entityId) } },
  //       {
  //         $lookup: {
  //           from: 'datasets',
  //           localField: 'datasetId',
  //           foreignField: '_id',
  //           as: 'datasetInfo',
  //         },
  //       },
  //       {
  //         $unwind: '$datasetInfo',
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           name: 1,
  //           description: 1,
  //           type: 1,
  //           visible: 1,
  //           styling: 1,
  //           zIndex: 1,
  //           createdAt: 1,
  //           lastAccessedAt: 1,
  //           'datasetInfo.name': 1,
  //           'datasetInfo.status': 1,
  //           'datasetInfo.validPointsCount': 1,
  //           'datasetInfo.sourceType': 1,
  //         },
  //       },
  //       {
  //         $sort: { zIndex: -1, createdAt: -1 },
  //       },
  //     ]);
  //   }

  //   /**
  //    * Delete layer
  //    */
  //   async deleteLayer(layerId: string, entityId: string): Promise<boolean> {
  //     const result = await LayerModel.model
  //       .deleteOne({
  //         _id: new Types.ObjectId(layerId),
  //         entity: new Types.ObjectId(entityId),
  //       })
  //       .exec();

  //     return result.deletedCount > 0;
  //   }

  //   /**
  //    * Delete layers by dataset
  //    */
  //   async deleteByDataset(datasetId: string): Promise<number> {
  //     const result = await LayerModel.model
  //       .deleteMany({ datasetId: new Types.ObjectId(datasetId) })
  //       .exec();

  //     return result.deletedCount;
  //   }
  //   /**
  //    * Delete layers by entity
  //    */
  //   async deleteByEntity(entityId: string): Promise<number> {
  //     const result = await LayerModel.model
  //       .deleteMany({ entity: new Types.ObjectId(entityId) })
  //       .exec();

  //     return result.deletedCount;
  //   }
  //   /**
  //    * Delete layers by type
  //    */
  //   async deleteByType(entityId: string, type: LayerType): Promise<number> {
  //     const result = await LayerModel.model
  //       .deleteMany({
  //         entity: new Types.ObjectId(entityId),
  //         type,
  //       })
  //       .exec();

  //     return result.deletedCount;
  //   }
}
