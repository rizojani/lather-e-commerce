import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Role } from '../common/types/roles.enum';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserRequest } from '../dto/users/create-user.users.dto';
import { UpdateProfileRequest } from '../dto/users/update-profile.users.dto';
import type { User } from '../schemas/user.schema';

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

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async updateProfile(userId: string, payload: UpdateProfileRequest) {
    if (!userId || !Types.ObjectId.isValid(userId.trim())) {
      throw new BadRequestException('Invalid user id');
    }
    const id = userId.trim();
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const update: Partial<User> = {};

    if (payload.fullName !== undefined) {
      const name = payload.fullName.trim();
      if (!name) {
        throw new BadRequestException('fullName cannot be empty');
      }
      update.name = name;
    }

    if (payload.email !== undefined) {
      const email = payload.email.trim().toLowerCase();
      if (email !== user.email) {
        const taken = await this.usersRepository.findByEmailExcludingId(email, id);
        if (taken) {
          throw new ConflictException('Email already in use');
        }
        update.email = email;
      }
    }

    if (payload.phone !== undefined) {
      update.phone = payload.phone.trim();
    }

    if (Object.keys(update).length === 0) {
      return user;
    }

    const updated = await this.usersRepository.updateById(id, update);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }
}
