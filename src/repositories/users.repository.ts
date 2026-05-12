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

  /** Email match owned by a different user (used to validate email-change uniqueness). */
  findByEmailExcludingId(email: string, id: string) {
    return this.model.findOne({ email, _id: { $ne: id } }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  updateById(id: string, payload: Partial<User>) {
    return this.model.findByIdAndUpdate(id, payload, { new: true }).exec();
  }

  /** Safe fields for admin order / embed (no password or reset tokens). */
  findByIdForAdmin(id: string) {
    return this.model
      .findById(id)
      .select('-password -passwordResetToken -passwordResetTokenExpiresAt')
      .lean()
      .exec();
  }
}
