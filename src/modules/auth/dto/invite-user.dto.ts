import { IsEmail, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/libs/constants';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'jane@unicef.org' })
  email: string;

  @IsEnum(UserRole)
  @IsOptional()
  @ApiProperty({ enum: UserRole, default: UserRole.MEMBER })
  role?: UserRole = UserRole.MEMBER;
}
