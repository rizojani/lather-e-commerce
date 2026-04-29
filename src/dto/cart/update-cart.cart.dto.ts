import { IsInt, IsMongoId, Min } from 'class-validator';

export class UpdateCartRequest {
  @IsMongoId()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
