import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequest {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  token!: string;

  @ApiProperty({ example: 'newPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
