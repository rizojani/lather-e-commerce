import { IsInt, IsMongoId, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartRequest {
  @ApiProperty({ example: '64f18f7a2fb4f8a12b0d1234' })
  @IsMongoId()
  productId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
