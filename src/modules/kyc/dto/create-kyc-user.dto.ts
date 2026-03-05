import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Length,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly label: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly streetNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly streetName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly landmark?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly lga?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly state?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly country?: string;
}

export class CreateKYCUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @ApiProperty()
  readonly firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @ApiProperty()
  readonly lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly phone: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  @ApiProperty({ required: false })
  readonly bvn?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  @ApiProperty({ required: false })
  readonly nin?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  @ApiProperty({ required: false })
  readonly passportNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ApiProperty({ type: [AddressDto], required: false })
  readonly addresses?: AddressDto[];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly streetNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly streetName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly landmark?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly lga?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly state?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly country?: string;
}
