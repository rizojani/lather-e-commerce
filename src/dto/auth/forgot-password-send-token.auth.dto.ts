import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordSendTokenRequest {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;
}
