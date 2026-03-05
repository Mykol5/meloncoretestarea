import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import DatasetModel, { Dataset } from '../model/dataset.model';

export class DatasetRepository extends AbstractRepo<Dataset> {
  constructor() {
    super(DatasetModel.model);
  }

  async findAll(): Promise<Dataset[]> {
    return DatasetModel.model.find().exec();
  }
}
