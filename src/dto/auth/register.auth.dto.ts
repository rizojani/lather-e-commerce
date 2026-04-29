import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/types/roles.enum';

export class RegisterRequest {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: Role, example: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Optional multipart key for profile image upload',
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
