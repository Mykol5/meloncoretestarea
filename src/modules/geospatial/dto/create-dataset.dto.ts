import { Types } from 'mongoose';
import { DataSourceType, DatasetStatus } from 'src/libs/constants';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  IsNumber,
  IsPositive,
  Length,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ColumnMappingsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Column name for latitude coordinates' })
  readonly latitude: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Column name for longitude coordinates' })
  readonly longitude: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Column name for data point labels' })
  readonly label?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Column name for geographic regions' })
  readonly region?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Column name for sector/category' })
  readonly sector?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Column name for status information' })
  readonly status?: string;
}

export class CreateDatasetDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  @ApiProperty({ description: 'Dataset name' })
  readonly name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Description must be between 0 and 1000 characters',
  })
  @ApiProperty({ description: 'Dataset description' })
  readonly description?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Original filename' })
  readonly fileName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'File path on server' })
  readonly filePath: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'File size in bytes' })
  readonly fileSize: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'Number of data rows' })
  readonly rowCount: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ColumnMappingsDto)
  @ApiProperty({
    type: ColumnMappingsDto,
    description: 'Column mapping configuration',
  })
  readonly columnMappings: ColumnMappingsDto;

  @IsOptional()
  @IsEnum(DataSourceType)
  @ApiProperty({ enum: DataSourceType, default: DataSourceType.CSV_IMPORT })
  readonly sourceType?: DataSourceType;

  @IsOptional()
  @IsEnum(DatasetStatus)
  @ApiProperty({ enum: DatasetStatus, default: DatasetStatus.PROCESSING })
  readonly status?: DatasetStatus;

  @IsOptional()
  @IsObject()
  @ApiProperty({ description: 'Additional metadata' })
  readonly metadata?: any;

  @IsOptional()
  @ApiProperty({ description: 'Entity ID (auto-populated from user)' })
  readonly entity?: Types.ObjectId;

  @IsOptional()
  @ApiProperty({ description: 'Created by user ID (auto-populated)' })
  readonly createdBy?: Types.ObjectId;
}
