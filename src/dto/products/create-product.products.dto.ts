import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Gender } from '../../common/types/product.enum';

export class CreateProductRequest {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsMongoId()
  category!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsArray()
  sizes!: string[];

  @IsArray()
  colors!: string[];

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsNumber()
  @Min(0)
  stock!: number;
}
