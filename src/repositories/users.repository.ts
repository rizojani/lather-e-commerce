import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

  create(payload: Partial<User>) {
    return this.model.create(payload);
  }

  findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }
}
