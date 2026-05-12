import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../common/types/product.enum';

export class ProductListRequest {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 24, minimum: 1 })
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: Gender, example: Gender.UNISEX })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Skincare' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: ['low_to_high', 'high_to_low'], example: 'low_to_high' })
  @IsOptional()
  @IsIn(['low_to_high', 'high_to_low'])
  price?: 'low_to_high' | 'high_to_low';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
