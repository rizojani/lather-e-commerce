import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ContactInfoPayloadDto {
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
}
