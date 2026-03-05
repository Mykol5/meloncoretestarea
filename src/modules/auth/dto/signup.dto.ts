import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'john@unicef.org' })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'johndoe', required: false })
  username?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '+1234567890', required: false })
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  @ApiProperty({ example: 'SecurePass123' })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'UNICEF Nigeria', required: false })
  organizationName?: string;
}
