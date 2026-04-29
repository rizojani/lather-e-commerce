import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { AddressType } from '../../schemas/address.schema';
import { AddressPayloadDto } from './address-payload.dto';

export class CreateUserAddressDto extends AddressPayloadDto {
  @ApiProperty({ enum: [AddressType.SHIPPING, AddressType.BILLING], example: AddressType.SHIPPING })
  @IsIn([AddressType.SHIPPING, AddressType.BILLING])
  type!: AddressType.SHIPPING | AddressType.BILLING;
}
