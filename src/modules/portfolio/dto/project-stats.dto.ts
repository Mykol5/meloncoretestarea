import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import {
  ProjectStatus,
  ProjectSector,
  ProjectRegion,
} from 'src/libs/constants';

export class ProjectStatsQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiProperty({ enum: ProjectStatus, required: false })
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectSector)
  @ApiProperty({ enum: ProjectSector, required: false })
  sector?: ProjectSector;

  @IsOptional()
  @IsEnum(ProjectRegion)
  @ApiProperty({ enum: ProjectRegion, required: false })
  region?: ProjectRegion;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  search?: string;
}
