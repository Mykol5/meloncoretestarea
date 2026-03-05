import { Types } from 'mongoose';
import { LayerType } from 'src/libs/constants';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsHexColor,
  Length,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LayerStylingDto {
  @IsOptional()
  @IsHexColor()
  @ApiProperty({
    description: 'Layer color in hex format',
    example: '#5B94E5',
    default: '#5B94E5',
  })
  readonly color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({
    description: 'Layer opacity (0-1)',
    example: 0.8,
    default: 0.8,
  })
  readonly opacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({
    description: 'Point radius in pixels',
    example: 10,
    default: 10,
  })
  readonly radius?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Metric field for data-driven styling',
    example: 'beneficiaries',
  })
  readonly metric?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Color scale type',
    example: 'sequential',
    enum: ['sequential', 'diverging', 'categorical'],
  })
  readonly colorScale?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  @ApiProperty({
    description: 'Cluster radius for grouping nearby points',
    example: 50,
    default: 50,
  })
  readonly clusterRadius?: number;
}

export class CreateLayerDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  @ApiProperty({
    description: 'Layer name',
    example: 'Health Centers Lagos',
  })
  readonly name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, {
    message: 'Description must be between 0 and 500 characters',
  })
  @ApiProperty({
    description: 'Layer description',
    example: 'Primary health centers in Lagos State',
  })
  readonly description?: string;

  @IsNotEmpty()
  @IsEnum(LayerType)
  @ApiProperty({
    enum: LayerType,
    description: 'Type of layer visualization',
  })
  readonly type: LayerType;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Dataset ID this layer is based on',
    example: '507f1f77bcf86cd799439011',
  })
  readonly datasetId: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the layer is visible on map',
    default: true,
  })
  readonly visible?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => LayerStylingDto)
  @ApiProperty({
    type: LayerStylingDto,
    description: 'Layer styling configuration',
  })
  readonly styling?: LayerStylingDto;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Filter configuration for the layer',
    example: { sector: ['Health'], status: ['active'] },
  })
  readonly filterConfig?: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  @ApiProperty({
    description: 'Display order/priority (higher = top)',
    example: 1,
    default: 0,
  })
  readonly zIndex?: number;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Additional layer metadata',
  })
  readonly metadata?: any;
}
