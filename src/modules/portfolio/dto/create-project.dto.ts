import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Length,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ProjectStatus,
  ProjectSector,
  ProjectRegion,
  FundingSource,
  ProjectPriority,
} from 'src/libs/constants';

export class TeamMemberDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  @ApiProperty()
  role: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  @ApiProperty()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  phone?: string;
}

export class FileAttachmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fileUrl: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fileType: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  fileSize?: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  description?: string;
}

export class ProjectTagDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  color?: string;
}

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, { message: 'Title must be between 2 and 200 characters' })
  @ApiProperty()
  readonly title: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000, {
    message: 'Description must be between 0 and 2000 characters',
  })
  @ApiProperty()
  readonly description?: string;

  @IsNotEmpty()
  @IsEnum(ProjectSector)
  @ApiProperty({ enum: ProjectSector })
  readonly sector: ProjectSector;

  @IsNotEmpty()
  @IsEnum(ProjectRegion)
  @ApiProperty({ enum: ProjectRegion })
  readonly region: ProjectRegion;

  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.DRAFT })
  readonly status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPriority)
  @ApiProperty({ enum: ProjectPriority, default: ProjectPriority.MEDIUM })
  readonly priority?: ProjectPriority;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  readonly startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  readonly endDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly totalBudget: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly spentBudget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly targetHouseholds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly actualHouseholds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  readonly coverageArea?: number; // in km²

  @IsOptional()
  @IsEnum(FundingSource)
  @ApiProperty({ enum: FundingSource })
  readonly fundingSource?: FundingSource;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  @ApiProperty({ type: [TeamMemberDto] })
  readonly teamMembers?: TeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectTagDto)
  @ApiProperty({ type: [ProjectTagDto] })
  readonly tags?: ProjectTagDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  @ApiProperty({ type: [FileAttachmentDto] })
  readonly attachments?: FileAttachmentDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ default: 0 })
  readonly progressPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ default: 0 })
  readonly impactScore?: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  readonly objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  readonly expectedOutcomes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  readonly risks?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly notes?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: true })
  readonly isActive?: boolean;
}
