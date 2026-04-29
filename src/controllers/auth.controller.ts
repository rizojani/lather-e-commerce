import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthResource } from '../resources/auth.resource';
import { multerConfig } from '../config/multer.config';
import { ForgotPasswordSendTokenRequest } from '../dto/auth/forgot-password-send-token.auth.dto';
import { ForgotPasswordVerifyTokenRequest } from '../dto/auth/forgot-password-verify-token.auth.dto';
import { LoginRequest } from '../dto/auth/login.auth.dto';
import { RegisterRequest } from '../dto/auth/register.auth.dto';
import { ResetPasswordRequest } from '../dto/auth/reset-password.auth.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @UseInterceptors(FileInterceptor('profileImage', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        password: { type: 'string', example: 'password123' },
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Optional profile image file',
        },
      },
      required: ['name', 'email', 'password'],
      examples: {
        withoutProfileImage: {
          summary: 'Register without profile image',
          value: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
          },
        },
        withProfileImage: {
          summary: 'Register with profile image',
          value: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            profileImage: '(binary)',
          },
        },
      },
    },
  })
  async register(
    @Body() payload: RegisterRequest,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const { accessToken, user } = await this.authService.register(payload, profileImage);
    return AuthResource.tokenResponse(accessToken, user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() payload: LoginRequest) {
    const token = await this.authService.login(payload);
    return AuthResource.tokenResponse(token);
  }

  @Post('forgot-password/send-token')
  @ApiOperation({ summary: 'Send forgot-password token' })
  forgotPasswordSendToken(@Body() payload: ForgotPasswordSendTokenRequest) {
    return this.authService.sendForgotPasswordToken(payload.email);
  }

  @Post('forgot-password/verify-token')
  @ApiOperation({ summary: 'Verify forgot-password token' })
  forgotPasswordVerifyToken(@Body() payload: ForgotPasswordVerifyTokenRequest) {
    return this.authService.verifyForgotPasswordToken(payload.email, payload.token);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  resetPassword(@Body() payload: ResetPasswordRequest) {
    return this.authService.resetPassword(payload.email, payload.token, payload.password);
  }
}
