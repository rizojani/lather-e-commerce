import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserAddressDto } from '../dto/address/create-user-address.dto';
import { Address, AddressDocument, AddressOwnerType, AddressType } from '../schemas/address.schema';
import { AddressPayloadDto } from '../dto/address/address-payload.dto';
import { ContactInfoPayloadDto } from '../dto/orders/contact-info.dto';

@Injectable()
export class AddressesService {
  constructor(@InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>) {}

  createForUser(userId: string, payload: CreateUserAddressDto) {
    return this.addressModel.create({
      ...payload,
      modelType: AddressOwnerType.USER,
      modelId: new Types.ObjectId(userId),
    });
  }

  listForUser(userId: string) {
    return this.addressModel
      .find({ modelType: AddressOwnerType.USER, modelId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateForUser(userId: string, id: string, payload: Partial<AddressPayloadDto>) {
    const address = await this.addressModel.findOneAndUpdate(
      { _id: id, modelType: AddressOwnerType.USER, modelId: userId },
      payload,
      { new: true },
    );
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async removeForUser(userId: string, id: string) {
    const deleted = await this.addressModel.findOneAndDelete({
      _id: id,
      modelType: AddressOwnerType.USER,
      modelId: userId,
    });
    if (!deleted) {
      throw new NotFoundException('Address not found');
    }
    return { message: 'Address deleted successfully' };
  }

  createOrderAddresses(
    orderId: string,
    payload: { contactInfo: ContactInfoPayloadDto; shippingAddress: AddressPayloadDto; billingAddress: AddressPayloadDto },
  ) {
    return this.addressModel.insertMany([
      { ...payload.contactInfo, modelType: AddressOwnerType.ORDER, modelId: new Types.ObjectId(orderId), type: AddressType.CONTACT },
      { ...payload.shippingAddress, modelType: AddressOwnerType.ORDER, modelId: new Types.ObjectId(orderId), type: AddressType.SHIPPING },
      { ...payload.billingAddress, modelType: AddressOwnerType.ORDER, modelId: new Types.ObjectId(orderId), type: AddressType.BILLING },
    ]);
  }
}
