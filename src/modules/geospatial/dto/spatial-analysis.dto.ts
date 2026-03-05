import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AnalysisType, AggregationType } from 'src/libs/constants';
import { GeoBoundsDto } from './map-filters.dto';

export class ClusterAnalysisDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(10)
  @Max(1000)
  @ApiProperty({
    description: 'Cluster radius in meters',
    example: 500,
    default: 500,
  })
  readonly radius: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(100)
  @ApiProperty({
    description: 'Minimum points to form a cluster',
    example: 3,
    default: 3,
  })
  readonly minPoints?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Metric to weight clusters by',
    example: 'beneficiaries',
  })
  readonly weightMetric?: string;
}

export class DensityAnalysisDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  @Max(10000)
  @ApiProperty({
    description: 'Grid cell size in meters',
    example: 1000,
    default: 1000,
  })
  readonly gridSize: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Metric to calculate density for',
    example: 'beneficiaries',
  })
  readonly metric: string;

  @IsOptional()
  @IsEnum(AggregationType)
  @ApiProperty({
    enum: AggregationType,
    description: 'How to aggregate values in each grid cell',
    default: AggregationType.SUM,
  })
  readonly aggregation?: AggregationType;
}

export class ProximityAnalysisDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @ApiProperty({
    description: 'Reference point latitude',
    example: 6.5244,
  })
  readonly centerLat: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @ApiProperty({
    description: 'Reference point longitude',
    example: 3.3792,
  })
  readonly centerLng: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  @Max(100000)
  @ApiProperty({
    description: 'Maximum distance in meters',
    example: 5000,
  })
  readonly maxDistance: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'Distance intervals for analysis',
    example: [1000, 2000, 3000, 4000, 5000],
    type: [Number],
  })
  readonly intervals?: number[];
}

export class RegionalAnalysisDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Field to group regions by',
    example: 'region',
  })
  readonly groupByField: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Metric to analyze',
    example: 'beneficiaries',
  })
  readonly metric: string;

  @IsNotEmpty()
  @IsEnum(AggregationType)
  @ApiProperty({
    enum: AggregationType,
    description: 'How to aggregate metric values',
  })
  readonly aggregation: AggregationType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @ApiProperty({
    description: 'Maximum number of top regions to return',
    example: 10,
    default: 10,
  })
  readonly topN?: number;
}

export class SpatialAnalysisDto {
  @IsNotEmpty()
  @IsEnum(AnalysisType)
  @ApiProperty({
    enum: AnalysisType,
    description: 'Type of spatial analysis to perform',
  })
  readonly analysisType: AnalysisType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Dataset IDs to include in analysis',
    example: ['dataset1', 'dataset2'],
    type: [String],
  })
  readonly datasetIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Layer IDs to include in analysis',
    example: ['layer1', 'layer2'],
    type: [String],
  })
  readonly layerIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoBoundsDto)
  @ApiProperty({
    type: GeoBoundsDto,
    description: 'Geographic bounds for analysis',
  })
  readonly bounds?: GeoBoundsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClusterAnalysisDto)
  @ApiProperty({
    type: ClusterAnalysisDto,
    description: 'Cluster analysis parameters',
  })
  readonly clusterParams?: ClusterAnalysisDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DensityAnalysisDto)
  @ApiProperty({
    type: DensityAnalysisDto,
    description: 'Density analysis parameters',
  })
  readonly densityParams?: DensityAnalysisDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProximityAnalysisDto)
  @ApiProperty({
    type: ProximityAnalysisDto,
    description: 'Proximity analysis parameters',
  })
  readonly proximityParams?: ProximityAnalysisDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegionalAnalysisDto)
  @ApiProperty({
    type: RegionalAnalysisDto,
    description: 'Regional analysis parameters',
  })
  readonly regionalParams?: RegionalAnalysisDto;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Additional filters to apply',
    example: { sector: ['Health'], status: ['active'] },
  })
  readonly filters?: any;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Additional analysis options',
  })
  readonly options?: any;
}

export class SpatialAnalysisResponseDto {
  @ApiProperty({ description: 'Analysis type performed' })
  readonly analysisType: AnalysisType;

  @ApiProperty({ description: 'Number of data points analyzed' })
  readonly totalPoints: number;

  @ApiProperty({ description: 'Analysis results data' })
  readonly results: any;

  @ApiProperty({ description: 'Analysis metadata' })
  readonly metadata: {
    executionTime: number;
    bounds?: GeoBoundsDto;
    parameters: any;
    generatedAt: Date;
  };

  @ApiProperty({ description: 'Summary statistics' })
  readonly summary?: {
    [key: string]: number | string;
  };
}
