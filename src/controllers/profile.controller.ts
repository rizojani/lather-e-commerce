import { Body, Controller, Get, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';
import { UpdateProfileRequest } from '../dto/users/update-profile.users.dto';
import { UserResource } from '../resources/user.resource';
import { MediaService } from '../services/media.service';
import { UsersService } from '../services/users.service';
import type { User } from '../schemas/user.schema';

@Controller('profile')
@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.USER, Role.ADMIN)
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ResponseMessage('Profile fetched successfully')
  async me(@CurrentUser('sub') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const media = await this.loadProfileMedia(user);
    return UserResource.profile(user, media);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile (admin or user)' })
  @ResponseMessage('Profile updated successfully')
  async update(
    @CurrentUser('sub') userId: string,
    @Body() payload: UpdateProfileRequest,
  ) {
    const updated = await this.usersService.updateProfile(userId, payload);
    const media = await this.loadProfileMedia(updated);
    return UserResource.profile(updated, media);
  }

  private async loadProfileMedia(user: User & { profileImage?: unknown }) {
    if (!user.profileImage) return null;
    return this.mediaService.findById(String(user.profileImage));
  }
}
