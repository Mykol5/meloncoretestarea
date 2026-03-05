import { Types } from 'mongoose';
import {
  DataSourceType,
  DataSourceStatus,
  ColumnDataType,
} from 'src/libs/constants';
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
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly name: string;

  @IsNotEmpty()
  @IsEnum(ColumnDataType)
  @ApiProperty({ enum: ColumnDataType })
  readonly type: ColumnDataType;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly displayName?: string;

  @IsOptional()
  @ApiProperty()
  readonly nullable?: boolean;

  @IsOptional()
  @ApiProperty()
  readonly unique?: boolean;
}

export class CreateDataSourceDto {
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
  @IsEnum(DataSourceType)
  @ApiProperty({ enum: DataSourceType })
  readonly type: DataSourceType;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly fileName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly filePath?: string;

  @IsOptional()
  @ApiProperty()
  readonly reportId?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  @ApiProperty({ type: [ColumnMappingDto] })
  readonly columns?: ColumnMappingDto[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly rowCount?: number;

  @IsOptional()
  @IsEnum(DataSourceStatus)
  @ApiProperty({ enum: DataSourceStatus, default: DataSourceStatus.PROCESSING })
  readonly status?: DataSourceStatus;

  @IsOptional()
  @IsObject()
  @ApiProperty()
  readonly metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ApiProperty()
  readonly preview?: Record<string, any>[];

  @ApiProperty()
  readonly entity?: Types.ObjectId;
}
