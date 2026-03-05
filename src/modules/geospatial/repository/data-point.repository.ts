import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import DataPointModel, { DataPoint } from '../model/data-point.model';

export class DataPointRepository extends AbstractRepo<DataPoint> {
  constructor() {
    super(DataPointModel.model);
  }

  async findAll(): Promise<DataPoint[]> {
    return DataPointModel.model.find().exec();
  }
}
