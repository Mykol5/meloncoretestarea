import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class MetricResponseDto {
  @IsNotEmpty()
  @ApiProperty()
  readonly metricId: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly actualValue: number;
}
