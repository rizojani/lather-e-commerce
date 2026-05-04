import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseMongoIdArrayFormValue } from '../../common/utils/parse-mongo-id-array-form';
import { InventoryStatus, ProductListingStatus } from '../../common/types/product-admin.enum';

export class ListAdminProductsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Resolved list of category Mongo ObjectId strings (`$in` filter). Omitted when not filtering. */
  @ApiPropertyOptional({
    description:
      'Optional. Non-empty array of category Mongo ObjectId strings. Same logical type as `string[]` in JSON — query may send bracket keys, repeated keys, commas, or one JSON-array string.',
    type: 'array',
    items: { type: 'string', example: '507f1f77bcf86cd799439011' },
    example: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'],
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => parseMongoIdArrayFormValue(value))
  @IsArray({ message: 'categoryIds must be an array of Mongo id strings after parsing' })
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Case-insensitive match on product title, legacy name, or category name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProductListingStatus })
  @IsOptional()
  @IsEnum(ProductListingStatus)
  status?: ProductListingStatus;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  inventoryStatus?: InventoryStatus;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Filter products with createdAt >= start of this day (UTC)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Filter products with createdAt <= end of this day (UTC)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
