import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from '../controllers/profile.controller';
import { UsersController } from '../controllers/users.controller';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from '../services/users.service';
import { User, UserSchema } from '../schemas/user.schema';
import { MediaModule } from './media.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MediaModule,
  ],
  controllers: [UsersController, ProfileController],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository, MongooseModule],
})
export class UsersModule {}
