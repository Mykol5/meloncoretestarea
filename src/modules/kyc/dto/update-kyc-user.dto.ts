import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateKYCUserDto } from './create-kyc-user.dto';
import { KYCStatus } from 'src/libs/constants';

export class UpdateKYCUserDto extends PartialType(CreateKYCUserDto) {
  @IsOptional()
  @IsEnum(KYCStatus)
  @ApiProperty({ enum: KYCStatus, required: false })
  readonly status?: KYCStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly rejectionReason?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly agentNotes?: string;
}
