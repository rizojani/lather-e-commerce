import { Transform, Type } from 'class-transformer';
import {
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryStatus, ProductListingStatus } from '../../common/types/product-admin.enum';

export class CreateAdminProductDto {
  @ApiProperty({ example: '64f18f7a2fb4f8a12b0d1111' })
  @IsMongoId()
  categoryId!: string;

  @ApiProperty({ example: 'Summer jacket' })
  @IsString()
  title!: string;

  @ApiProperty({ example: '<p>Rich HTML description</p>' })
  @IsString()
  description!: string;

  @ApiProperty({ enum: InventoryStatus, example: InventoryStatus.IN_STOCK })
  @IsEnum(InventoryStatus)
  inventoryStatus!: InventoryStatus;

  @ApiProperty({ enum: ProductListingStatus, example: ProductListingStatus.ACTIVE })
  @IsEnum(ProductListingStatus)
  status!: ProductListingStatus;

  @ApiProperty({ example: 99.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: true })
  @Transform(({ value }) => value === true || value === 'true' || value === '1' || value === 1)
  @IsBoolean()
  hasDiscount!: boolean;

  @ApiPropertyOptional({ example: 15, description: 'Required when hasDiscount is true' })
  @ValidateIf((o: CreateAdminProductDto) => o.hasDiscount === true)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountInPercentage?: number;
}
