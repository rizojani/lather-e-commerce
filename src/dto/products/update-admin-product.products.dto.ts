import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseMongoIdArrayFormValue } from '../../common/utils/parse-mongo-id-array-form';
import { InventoryStatus, ProductListingStatus } from '../../common/types/product-admin.enum';

export class UpdateAdminProductDto {
  @ApiPropertyOptional({ example: '64f18f7a2fb4f8a12b0d1111' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Summer jacket' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '<p>HTML</p>' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  inventoryStatus?: InventoryStatus;

  @ApiPropertyOptional({ enum: ProductListingStatus })
  @IsOptional()
  @IsEnum(ProductListingStatus)
  status?: ProductListingStatus;

  @ApiPropertyOptional({ example: 99.99, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === true || value === 'true' || value === '1' || value === 1;
  })
  @IsBoolean()
  hasDiscount?: boolean;

  @ApiPropertyOptional({ example: 15, description: 'When hasDiscount is true, should be sent (0–100).' })
  @ValidateIf((o: UpdateAdminProductDto) => o.hasDiscount === true)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountInPercentage?: number;

  @ApiPropertyOptional({
    description:
      'Media ids to remove from this product (must belong to product). Same array formats as categoryIds query (bracket keys, JSON array string, comma-separated).',
    type: 'array',
    items: { type: 'string' },
  })
  @IsOptional()
  @Transform(({ value }) => parseMongoIdArrayFormValue(value))
  @IsArray()
  @IsMongoId({ each: true })
  deleteMediaIds?: string[];
}
