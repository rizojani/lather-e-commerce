import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/types/roles.enum';
import { AnalyticsService } from '../services/analytics.service';

@Controller('admin/analytics')
@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin analytics dashboard' })
  @ResponseMessage('Analytics fetched successfully')
  dashboard() {
    return this.analyticsService.dashboard();
  }
}
