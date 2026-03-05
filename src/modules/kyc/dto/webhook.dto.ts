import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVerificationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'KYC user ID from web app' })
  readonly web_job_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Mobile job ID' })
  readonly mobile_job_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @ApiProperty({ description: 'Verified latitude coordinate' })
  readonly verified_lat: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @ApiProperty({ description: 'Verified longitude coordinate' })
  readonly verified_lng: number;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Array of photo URLs', type: [String] })
  readonly photos: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Agent notes about verification',
    required: false,
  })
  readonly agent_notes?: string;
}

export class AgentAssignmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'KYC user ID from web app' })
  readonly web_job_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Agent ID from mobile app' })
  readonly agent_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Job ID from mobile app' })
  readonly mobile_job_id: string;
}

export class StartReviewDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'KYC user ID from web app' })
  readonly web_job_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Mobile job ID' })
  readonly mobile_job_id: string;
}
export class VerificationDecisionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'true for approve, false for reject' })
  readonly approved: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Reason for rejection', required: false })
  readonly rejectionReason?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Address index for multi-address',
    required: false,
  })
  readonly addressIndex?: number;
}
