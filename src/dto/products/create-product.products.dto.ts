import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../common/types/product.enum';

export class CreateProductRequest {
  @ApiProperty({ example: 'Face Wash' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Gentle face wash for daily use' })
  @IsString()
  description!: string;

  @ApiProperty({ example: '64f18f7a2fb4f8a12b0d1111' })
  @IsMongoId()
  category!: string;

  @ApiProperty({ enum: Gender, example: Gender.UNISEX })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: ['S', 'M', 'L'] })
  @IsArray()
  sizes!: string[];

  @ApiProperty({ example: ['Black', 'Blue'] })
  @IsArray()
  colors!: string[];

  @ApiProperty({ example: 499, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 449, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiProperty({ example: 120, minimum: 0 })
  @IsNumber()
  @Min(0)
  stock!: number;
}
