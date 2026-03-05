import { Types } from 'mongoose';
import { ChartType, AggregationType, ChartStatus } from 'src/libs/constants';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  Length,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChartFilterDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly column: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly operator: string; // 'equals', 'contains', 'greater_than', etc.

  @IsNotEmpty()
  @ApiProperty()
  readonly value: any;
}

export class ChartStylingDto {
  @IsOptional()
  @IsArray()
  @ApiProperty({ type: [String] })
  readonly colors?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: true })
  readonly showLegend?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: true })
  readonly showGrid?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly subtitle?: string;

  @IsOptional()
  @ApiProperty()
  readonly width?: number;

  @IsOptional()
  @ApiProperty()
  readonly height?: number;
}

export class CreateChartDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
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
  @IsEnum(ChartType)
  @ApiProperty({ enum: ChartType })
  readonly type: ChartType;

  @IsNotEmpty()
  @ApiProperty()
  readonly dataSourceId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly xAxis: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly yAxis?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly groupBy?: string;

  @IsNotEmpty()
  @IsEnum(AggregationType)
  @ApiProperty({ enum: AggregationType })
  readonly aggregation: AggregationType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChartFilterDto)
  @ApiProperty({ type: [ChartFilterDto] })
  readonly filters?: ChartFilterDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ChartStylingDto)
  @ApiProperty({ type: ChartStylingDto })
  readonly styling?: ChartStylingDto;

  @IsOptional()
  @IsEnum(ChartStatus)
  @ApiProperty({ enum: ChartStatus, default: ChartStatus.DRAFT })
  readonly status?: ChartStatus;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: false })
  readonly isShared?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly shareToken?: string;

  @ApiProperty()
  readonly entity?: Types.ObjectId;
}
