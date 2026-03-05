import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDatasetDto } from './create-dataset.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  Length,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DatasetStatus } from 'src/libs/constants';
import { Type } from 'class-transformer';
import { ColumnMappingsDto } from './create-dataset.dto';

export class UpdateDatasetDto extends PartialType(
  OmitType(CreateDatasetDto, [
    'fileName',
    'filePath',
    'fileSize',
    'rowCount',
    'entity',
    'createdBy',
  ] as const),
) {
  @IsOptional()
  @IsString()
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  @ApiProperty({ description: 'Dataset name' })
  readonly name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Description must be between 0 and 1000 characters',
  })
  @ApiProperty({ description: 'Dataset description' })
  readonly description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ColumnMappingsDto)
  @ApiProperty({
    type: ColumnMappingsDto,
    description: 'Updated column mapping configuration',
  })
  readonly columnMappings?: ColumnMappingsDto;

  @IsOptional()
  @IsEnum(DatasetStatus)
  @ApiProperty({ enum: DatasetStatus, description: 'Dataset status' })
  readonly status?: DatasetStatus;

  @IsOptional()
  @IsObject()
  @ApiProperty({ description: 'Additional metadata' })
  readonly metadata?: any;
}
