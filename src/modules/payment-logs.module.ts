import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentLog, PaymentLogSchema } from '../schemas/payment-log.schema';
import { PaymentLogsService } from '../services/payment-logs.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaymentLog.name, schema: PaymentLogSchema }])],
  providers: [PaymentLogsService],
  exports: [PaymentLogsService, MongooseModule],
})
export class PaymentLogsModule {}
