import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesController } from '../controllers/addresses.controller';
import { Address, AddressSchema } from '../schemas/address.schema';
import { AddressesService } from '../services/addresses.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Address.name, schema: AddressSchema }])],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService, MongooseModule],
})
export class AddressesModule {}
