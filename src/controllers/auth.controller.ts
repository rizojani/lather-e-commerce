import { Body, Controller, Post } from '@nestjs/common';
import { AuthResource } from '../resources/auth.resource';
import { LoginRequest } from '../dto/auth/login.auth.dto';
import { RegisterRequest } from '../dto/auth/register.auth.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() payload: RegisterRequest) {
    const token = await this.authService.register(payload);
    return AuthResource.tokenResponse(token);
  }

  @Post('login')
  async login(@Body() payload: LoginRequest) {
    const token = await this.authService.login(payload);
    return AuthResource.tokenResponse(token);
  }
}
