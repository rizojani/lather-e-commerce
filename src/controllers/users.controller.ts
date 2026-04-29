import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';

@Controller('users')
@ApiTags('User - Profile')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  @Get('me')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Get current user profile' })
  profile() {
    return { message: 'Profile endpoint ready' };
  }
}
