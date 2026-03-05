import { PartialType } from '@nestjs/swagger';
import { CreateImpactMetricDto } from './create-impact-metric.dto';

export class UpdateImpactMetricDto extends PartialType(CreateImpactMetricDto) {}
