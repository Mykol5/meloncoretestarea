import { QuestionDto } from './question.dto';
import { ReportCategory, ReportStatus } from 'src/libs/constants';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Length,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, { message: 'Title must be between 2 and 200 characters' })
  @ApiProperty()
  readonly title: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Description must be between 0 and 1000 characters',
  })
  @ApiProperty()
  readonly description?: string;

  @IsOptional()
  @IsEnum(ReportCategory)
  @ApiProperty({ enum: ReportCategory })
  readonly category?: ReportCategory;

  @IsOptional()
  @IsEnum(ReportStatus)
  @ApiProperty({ enum: ReportStatus, default: ReportStatus.DRAFT })
  readonly status?: ReportStatus;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: false })
  readonly allowMultipleResponses?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: false })
  readonly collectEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: false })
  readonly isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  @ApiProperty({ type: [QuestionDto] })
  readonly questions?: QuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ default: 0 })
  readonly responseCount?: number;

  @IsOptional()
  @ApiProperty()
  readonly shareToken?: string;
}
