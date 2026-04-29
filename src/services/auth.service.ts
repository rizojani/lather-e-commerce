import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { Role } from '../common/types/roles.enum';
import { MediaOwnerType, MediaType } from '../schemas/media.schema';
import { MediaService } from './media.service';
import { UsersService } from '../services/users.service';
import { LoginRequest } from '../dto/auth/login.auth.dto';
import { RegisterRequest } from '../dto/auth/register.auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mediaService: MediaService,
  ) {}

  async register(payload: RegisterRequest, profileImage?: Express.Multer.File) {
    const { profileImage: _profileImageField, ...registerPayload } = payload;
    const hashedPassword = await bcrypt.hash(registerPayload.password, 10);
    const user = await this.usersService.create({
      ...registerPayload,
      password: hashedPassword,
      role: Role.USER,
    });
    let uploadedProfileMedia: Awaited<ReturnType<MediaService['create']>> | null = null;

    if (profileImage) {
      uploadedProfileMedia = await this.mediaService.create({
        file: profileImage,
        modelType: MediaOwnerType.USER,
        modelId: user.id,
        type: MediaType.PROFILE,
      });
      user.profileImage = uploadedProfileMedia._id;
      await user.save();
    }

    return {
      accessToken: this.signToken(user.id, user.email, user.role),
      user: this.mapUserForAuthResponse(user, uploadedProfileMedia),
    };
  }

  async login(payload: LoginRequest) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(payload.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.email, user.role);
  }

  async sendForgotPasswordToken(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found with this email');
    }

    const token = this.generateOtpToken();
    user.passwordResetToken = token;
    user.passwordResetTokenExpiresAt = this.getTokenExpiryDate();
    await user.save();

    return {
      message: 'Forgot password token sent successfully',
      data: { email: user.email, token },
    };
  }

  async verifyForgotPasswordToken(email: string, token: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordResetToken || !user.passwordResetTokenExpiresAt) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetToken !== token) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token expired');
    }

    return {
      message: 'Reset token verified successfully',
      data: { email: user.email, tokenValid: true },
    };
  }

  async resetPassword(email: string, token: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordResetToken || !user.passwordResetTokenExpiresAt) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetToken !== token) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token expired');
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save();

    return {
      message: 'Password reset successfully',
      data: { email: user.email },
    };
  }

  private signToken(sub: string, email: string, role: string) {
    return this.jwtService.sign({ sub, email, role });
  }

  private generateOtpToken(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private getTokenExpiryDate(minutes = 15): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private mapUserForAuthResponse(
    user: User & { id?: string; _id?: unknown },
    media?: { id?: string; _id?: unknown; originalName?: string; mimeType?: string; path?: string } | null,
  ) {
    const userId = user.id ?? String(user._id ?? '');
    return {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: media
        ? {
          id: media.id ?? String(media._id ?? ''),
          originalName: media.originalName ?? '',
          mimeType: media.mimeType ?? '',
          path: media.path ?? '',
        }
        : null,
    };
  }
}
