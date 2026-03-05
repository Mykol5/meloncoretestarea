import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareReportDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one recipient is required' })
  @IsEmail({}, { each: true, message: 'Each recipient must be a valid email' })
  @ApiProperty({
    type: [String],
    description: 'Array of recipient email addresses',
    example: ['user1@example.com', 'user2@example.com'],
  })
  recipients: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Personal message cannot exceed 500 characters' })
  @ApiProperty({
    description: 'Optional personal message to include with the report',
    example: 'Please take a few minutes to fill out this impact assessment.',
    required: false,
  })
  personalMessage?: string;
}
