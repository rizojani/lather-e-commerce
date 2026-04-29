import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AddressPayloadDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Street 12, House 44' })
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Near central park' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Karachi' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Sindh' })
  @IsString()
  state!: string;

  @ApiProperty({ example: 'Pakistan' })
  @IsString()
  country!: string;

  @ApiProperty({ example: '74200' })
  @IsString()
  postalCode!: string;
}
