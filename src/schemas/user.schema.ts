import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../common/types/roles.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ enum: Role, default: Role.USER })
  role!: Role;

  @Prop({ type: Types.ObjectId, ref: 'Media' })
  profileImage?: Types.ObjectId;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetTokenExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
