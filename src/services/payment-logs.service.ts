import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentMethod } from '../schemas/order.schema';
import { PaymentLog, PaymentLogDocument, PaymentLogOwnerType, PaymentStatus } from '../schemas/payment-log.schema';

@Injectable()
export class PaymentLogsService {
  constructor(@InjectModel(PaymentLog.name) private readonly paymentLogModel: Model<PaymentLogDocument>) {}

  createOrderPaymentLog(orderId: string, amount: number, paymentMethod: PaymentMethod) {
    return this.paymentLogModel.create({
      modelType: PaymentLogOwnerType.ORDER,
      modelId: new Types.ObjectId(orderId),
      amount,
      paymentMethod,
      status: PaymentStatus.UNPAID,
    });
  }
}
