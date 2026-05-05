import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { OrderStatus } from '../../schemas/order.schema';

export class PatchAdminOrderDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Required when status is `cancelled` or `rejected` (admin note to customer / internal).',
  })
  @ValidateIf((o: PatchAdminOrderDto) => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REJECTED)
  @IsString()
  @MinLength(1, { message: 'reason is required when status is cancelled or rejected' })
  reason?: string;
}
