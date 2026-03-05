import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ColumnMappingDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  displayName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  type: 'string' | 'number' | 'date' | 'boolean';

  @IsOptional()
  @ApiProperty({ default: true })
  nullable?: boolean;

  @IsOptional()
  @ApiProperty({ default: false })
  unique?: boolean;
}

export class CsvImportDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fileName: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: true })
  hasHeader?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ default: ',' })
  delimiter?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  @ApiProperty({ type: [ColumnMappingDto] })
  columnMappings: ColumnMappingDto[];

  @IsOptional()
  @ApiProperty()
  importOptions?: any;
}
