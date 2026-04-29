import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../common/types/product.enum';

export class ProductListRequest {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsIn(['low_to_high', 'high_to_low'])
  price?: 'low_to_high' | 'high_to_low';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
