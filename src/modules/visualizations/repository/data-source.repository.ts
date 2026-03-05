import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import DataSourceModel, { DataSource } from '../model/data-source.model';
import { Types } from 'mongoose';

export class DataSourceRepository extends AbstractRepo<DataSource> {
  constructor() {
    super(DataSourceModel.model);
  }

  async findAll(): Promise<DataSource[]> {
    return DataSourceModel.model.find().exec();
  }

  async findByEntity(entityId: string): Promise<DataSource[]> {
    return DataSourceModel.model
      .find({ entity: new Types.ObjectId(entityId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByType(entityId: string, type: string): Promise<DataSource[]> {
    return DataSourceModel.model
      .find({
        entity: new Types.ObjectId(entityId),
        type,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByReportId(reportId: string): Promise<DataSource | null> {
    return DataSourceModel.model
      .findOne({ reportId: new Types.ObjectId(reportId) })
      .exec();
  }
}
