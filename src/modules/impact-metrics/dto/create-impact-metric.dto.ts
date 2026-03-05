import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { MetricType, TrackingStatus } from 'src/libs/constants';

export class CreateImpactMetricDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, {
    message: 'Impact metric name must be between 2 and 200 characters',
  })
  @ApiProperty()
  readonly name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Description must be between 0 and 1000 characters',
  })
  @ApiProperty()
  readonly description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly target: number;

  @IsNotEmpty()
  @IsEnum(MetricType)
  @ApiProperty({ enum: MetricType })
  readonly metricType: MetricType;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  readonly startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  readonly endDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty()
  readonly scoringWeight: number;

  @IsOptional()
  @IsEnum(TrackingStatus)
  @ApiProperty({ enum: TrackingStatus, default: TrackingStatus.ON_TRACK })
  readonly trackingStatus?: TrackingStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly actualValue?: number;

  @ApiProperty()
  readonly organization?: Types.ObjectId;
}
