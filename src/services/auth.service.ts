import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../services/users.service';
import { LoginRequest } from '../dto/auth/login.auth.dto';
import { RegisterRequest } from '../dto/auth/register.auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterRequest) {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await this.usersService.create({ ...payload, password: hashedPassword });
    return this.signToken(user.id, user.email, user.role);
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

  private signToken(sub: string, email: string, role: string) {
    return this.jwtService.sign({ sub, email, role });
  }
}
