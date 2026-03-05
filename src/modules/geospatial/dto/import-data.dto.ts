// src/modules/geospatial/dto/import-data.dto.ts

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  IsBoolean,
  Length,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DataSourceType } from 'src/libs/constants';

export class ImportMappingsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Column name for latitude coordinates',
    example: 'lat',
  })
  readonly latitude: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Column name for longitude coordinates',
    example: 'lng',
  })
  readonly longitude: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for data point labels',
    example: 'title',
  })
  readonly label?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for geographic regions',
    example: 'region',
  })
  readonly region?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for sector/category',
    example: 'sector',
  })
  readonly sector?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for status information',
    example: 'status',
  })
  readonly status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for beneficiaries count',
    example: 'beneficiaries',
  })
  readonly beneficiaries?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for impact score',
    example: 'impact_score',
  })
  readonly impactScore?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Column name for coverage area',
    example: 'coverage_km',
  })
  readonly coverage?: string;
}

export class ImportDataDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  @ApiProperty({
    description: 'Dataset name',
    example: 'Lagos Health Centers 2024',
  })
  readonly name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Description must be between 0 and 1000 characters',
  })
  @ApiProperty({
    description: 'Dataset description',
    example: 'Community health centers across Lagos State with impact metrics',
  })
  readonly description?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ImportMappingsDto)
  @ApiProperty({
    type: ImportMappingsDto,
    description: 'Column mapping configuration',
  })
  readonly mappings: ImportMappingsDto;

  @IsOptional()
  @IsEnum(DataSourceType)
  @ApiProperty({
    enum: DataSourceType,
    default: DataSourceType.CSV_IMPORT,
    description: 'Source type of the data',
  })
  readonly sourceType?: DataSourceType;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    default: true,
    description: 'Whether to validate coordinates during import',
  })
  readonly validateCoordinates?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    default: false,
    description: 'Whether to skip duplicate entries',
  })
  readonly skipDuplicates?: boolean;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Additional metadata for the import',
  })
  readonly metadata?: any;
}

export class ImportResponseDto {
  @ApiProperty({ description: 'Created dataset ID' })
  readonly datasetId: string;

  @ApiProperty({ description: 'Number of rows processed' })
  readonly processedRows: number;

  @ApiProperty({ description: 'Number of valid data points created' })
  readonly validPoints: number;

  @ApiProperty({ description: 'Number of invalid/skipped rows' })
  readonly invalidRows: number;

  @ApiProperty({ description: 'List of validation errors', type: [String] })
  readonly errors: string[];

  @ApiProperty({ description: 'Import status' })
  readonly status: 'success' | 'partial' | 'failed';

  @ApiProperty({ description: 'Import completion message' })
  readonly message: string;
}
