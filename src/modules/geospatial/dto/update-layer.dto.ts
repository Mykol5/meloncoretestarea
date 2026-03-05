import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLayerDto, LayerStylingDto } from './create-layer.dto';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  Length,
  Min,
  Max,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LayerType } from 'src/libs/constants';
import { Type } from 'class-transformer';

export class UpdateLayerDto extends PartialType(
  OmitType(CreateLayerDto, ['datasetId'] as const),
) {
  @IsOptional()
  @IsString()
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  @ApiProperty({
    description: 'Layer name',
    example: 'Updated Health Centers Lagos',
  })
  readonly name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, {
    message: 'Description must be between 0 and 500 characters',
  })
  @ApiProperty({
    description: 'Layer description',
    example: 'Updated description for health centers',
  })
  readonly description?: string;

  @IsOptional()
  @IsEnum(LayerType)
  @ApiProperty({
    enum: LayerType,
    description: 'Type of layer visualization',
  })
  readonly type?: LayerType;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the layer is visible on map',
  })
  readonly visible?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => LayerStylingDto)
  @ApiProperty({
    type: LayerStylingDto,
    description: 'Updated layer styling configuration',
  })
  readonly styling?: LayerStylingDto;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Updated filter configuration for the layer',
  })
  readonly filterConfig?: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  @ApiProperty({
    description: 'Display order/priority (higher = top)',
  })
  readonly zIndex?: number;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Additional layer metadata',
  })
  readonly metadata?: any;
}

export class UpdateLayerVisibilityDto {
  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'Layer visibility state',
    example: true,
  })
  readonly visible: boolean;
}

export class UpdateLayerStylingDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LayerStylingDto)
  @ApiProperty({
    type: LayerStylingDto,
    description: 'Complete styling configuration update',
  })
  readonly styling: LayerStylingDto;
}
