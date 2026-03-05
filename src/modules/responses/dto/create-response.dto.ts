import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class QuestionResponseDto {
  @IsNotEmpty()
  @ApiProperty()
  questionId: string;

  @IsOptional()
  @ApiProperty()
  answer?: any;

  @IsOptional()
  @ApiProperty()
  impactMetricId?: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  actualValue?: number;
}

export class CreateResponseDto {
  @IsNotEmpty()
  @ApiProperty()
  reportId: Types.ObjectId;

  @IsOptional()
  @IsEmail()
  @ApiProperty()
  respondentEmail?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  respondentName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionResponseDto)
  @ApiProperty({ type: [QuestionResponseDto] })
  responses: QuestionResponseDto[];
}
