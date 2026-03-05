import { AbstractRepo } from '../../../libs/db/AbstractRepo';
import ImpactMetricsModel, {
  ImpactMetric,
} from '../model/impact-metrics.model';

export class ImpactMetricsRepository extends AbstractRepo<ImpactMetric> {
  constructor() {
    super(ImpactMetricsModel.model);
  }

  async findAll(): Promise<ImpactMetric[]> {
    return ImpactMetricsModel.model.find().exec();
  }
}
