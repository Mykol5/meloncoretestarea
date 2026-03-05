import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  Length,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from 'src/libs/constants';
import { Types } from 'mongoose';

export class QuestionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  id: string;

  @IsNotEmpty()
  @IsEnum(QuestionType)
  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  @ApiProperty()
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  @ApiProperty()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: false })
  required: boolean;

  @IsOptional()
  @IsArray()
  @ApiProperty({ type: [String] })
  options?: string[];

  @IsOptional()
  @ApiProperty()
  settings?: any;

  @ValidateIf((o) => o.type === QuestionType.IMPACT_METRIC)
  @IsNotEmpty()
  @ApiProperty({ description: 'Required when type is impact_metric' })
  impactMetricId?: Types.ObjectId;
}
