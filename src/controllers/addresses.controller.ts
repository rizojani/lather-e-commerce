import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateUserAddressDto } from '../dto/address/create-user-address.dto';
import { AddressPayloadDto } from '../dto/address/address-payload.dto';
import { AddressesService } from '../services/addresses.service';

@Controller('addresses')
@ApiTags('User - Addresses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create user address' })
  create(@CurrentUser('sub') userId: string, @Body() payload: CreateUserAddressDto) {
    return this.addressesService.createForUser(userId, payload);
  }

  @Get()
  @ApiOperation({ summary: 'List user addresses' })
  list(@CurrentUser('sub') userId: string) {
    return this.addressesService.listForUser(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user address' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() payload: Partial<AddressPayloadDto>,
  ) {
    return this.addressesService.updateForUser(userId, id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user address' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.addressesService.removeForUser(userId, id);
  }
}
