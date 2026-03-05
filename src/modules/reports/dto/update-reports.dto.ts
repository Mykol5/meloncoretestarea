import { PartialType } from '@nestjs/swagger';
import { CreateReportDto } from './create-reports.dto';

export class UpdateReportDto extends PartialType(CreateReportDto) {}
