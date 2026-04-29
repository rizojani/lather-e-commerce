import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkOrderPaymentPaidRequest {
  @ApiPropertyOptional({ example: 'txn_1234567890' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
