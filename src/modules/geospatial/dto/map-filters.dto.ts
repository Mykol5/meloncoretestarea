import {
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { GeospatialSector } from 'src/libs/constants';

export class GeoBoundsDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @ApiProperty({
    description: 'Northern boundary latitude',
    example: 10.5,
  })
  readonly north: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @ApiProperty({
    description: 'Southern boundary latitude',
    example: 8.5,
  })
  readonly south: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @ApiProperty({
    description: 'Eastern boundary longitude',
    example: 9.2,
  })
  readonly east: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @ApiProperty({
    description: 'Western boundary longitude',
    example: 7.8,
  })
  readonly west: number;
}

export class MapFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: 'Filter by geographic regions',
    example: ['Lagos', 'Kano', 'Abuja'],
    type: [String],
  })
  readonly regions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: 'Filter by countries',
    example: ['Nigeria', 'Ghana'],
    type: [String],
  })
  readonly countries?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(GeospatialSector, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: 'Filter by sectors',
    enum: GeospatialSector,
    example: ['Health', 'Education'],
    type: [String],
  })
  readonly sectors?: GeospatialSector[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: 'Filter by data sources',
    example: ['csv_import', 'report_response'],
    type: [String],
  })
  readonly sources?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: 'Filter by layer IDs',
    example: ['layer1', 'layer2'],
    type: [String],
  })
  readonly layers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: 'Filter by dataset IDs',
    example: ['dataset1', 'dataset2'],
    type: [String],
  })
  readonly datasets?: string[];

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Start date for filtering',
    example: '2024-01-01',
  })
  readonly startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'End date for filtering',
    example: '2024-12-31',
  })
  readonly endDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoBoundsDto)
  @ApiProperty({
    type: GeoBoundsDto,
    description: 'Geographic boundary for filtering',
  })
  readonly bounds?: GeoBoundsDto;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search text in titles and descriptions',
    example: 'health center',
  })
  readonly search?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Minimum value for metric filtering',
    example: 100,
  })
  readonly minValue?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Maximum value for metric filtering',
    example: 10000,
  })
  readonly maxValue?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Metric field to filter by',
    example: 'beneficiaries',
  })
  readonly metricField?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Additional custom filters',
    example: { status: 'active', priority: 'high' },
  })
  readonly customFilters?: any;
}

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  readonly limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({
    description: 'Number of items to skip',
    example: 0,
    default: 0,
  })
  readonly offset?: number = 0;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  readonly sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  readonly sortOrder?: 'asc' | 'desc' = 'desc';
}
