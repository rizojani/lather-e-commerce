import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../common/types/product.enum';

export class ProductListRequest {
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
