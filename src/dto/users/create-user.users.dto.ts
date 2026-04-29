import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from '../../common/types/roles.enum';

export class CreateUserRequest {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsEnum(Role)
  role?: Role;
}
