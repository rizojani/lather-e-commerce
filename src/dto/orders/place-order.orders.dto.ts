import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressPayloadDto } from '../address/address-payload.dto';
import { PaymentMethod } from '../../schemas/order.schema';

export class PlaceOrderRequest {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ type: AddressPayloadDto })
  @ValidateNested()
  @Type(() => AddressPayloadDto)
  contactInfo!: AddressPayloadDto;

  @ApiProperty({ type: AddressPayloadDto })
  @ValidateNested()
  @Type(() => AddressPayloadDto)
  shippingAddress!: AddressPayloadDto;

  @ApiProperty({ type: AddressPayloadDto })
  @ValidateNested()
  @Type(() => AddressPayloadDto)
  billingAddress!: AddressPayloadDto;
}
