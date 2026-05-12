import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CategoriesService } from '../services/categories.service';

/** Public category endpoints — no JWT; any client (guest, user, admin) may call. */
@Controller('categories')
@ApiTags('Public - Categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('dropdown')
  @ApiOperation({
    summary: 'Category dropdown (public)',
    description:
      'No authentication. Returns `{ id, title }[]` sorted A→Z. Only active categories; legacy documents without `status` count as active.',
  })
  @ResponseMessage('Categories fetched successfully')
  dropdown() {
    return this.categoriesService.listActiveForDropdown();
  }
}
