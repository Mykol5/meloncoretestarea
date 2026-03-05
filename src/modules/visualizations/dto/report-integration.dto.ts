import { Types } from 'mongoose';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDataSourceFromReportDto {
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
  @ApiProperty()
  readonly reportId: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @ApiProperty({ type: [String] })
  readonly selectedFields?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly dateRange?: string; // 'last_week', 'last_month', 'all', etc.
}
