import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import ChartModel, { Chart } from '../model/chart.model';
import { Types } from 'mongoose';

export class ChartRepository extends AbstractRepo<Chart> {
  constructor() {
    super(ChartModel.model);
  }

  async findAll(): Promise<Chart[]> {
    return ChartModel.model.find().exec();
  }

  async findByEntity(entityId: string): Promise<Chart[]> {
    return ChartModel.model
      .find({ entity: new Types.ObjectId(entityId) })
      .populate('dataSourceId', 'name type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDataSource(dataSourceId: string): Promise<Chart[]> {
    return ChartModel.model
      .find({ dataSourceId: new Types.ObjectId(dataSourceId) })
      .exec();
  }

  async findSharedCharts(entityId: string): Promise<Chart[]> {
    return ChartModel.model
      .find({
        entity: new Types.ObjectId(entityId),
        isShared: true,
      })
      .populate('dataSourceId', 'name type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByShareToken(shareToken: string): Promise<Chart | null> {
    return ChartModel.model
      .findOne({ shareToken, isShared: true })
      .populate('dataSourceId')
      .exec();
  }

  async deleteByDataSource(
    dataSourceId: string,
  ): Promise<{ deletedCount: number }> {
    const result = await ChartModel.model
      .deleteMany({ dataSourceId: new Types.ObjectId(dataSourceId) })
      .exec();

    return { deletedCount: result.deletedCount };
  }
}
