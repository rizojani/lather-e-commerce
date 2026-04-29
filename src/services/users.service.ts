import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from '../common/types/roles.enum';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserRequest } from '../dto/users/create-user.users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(payload: CreateUserRequest) {
    const exists = await this.usersRepository.findByEmail(payload.email);
    if (exists) {
      throw new ConflictException('Email already exists');
    }

    return this.usersRepository.create({ ...payload, role: payload.role ?? Role.USER });
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }
}
