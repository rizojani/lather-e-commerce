import { IsEnum } from 'class-validator';
import { PaymentMethod } from '../../schemas/order.schema';

export class PlaceOrderRequest {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
