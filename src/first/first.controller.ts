import { Controller } from '@nestjs/common';
import { FirstService } from './first.service';

@Controller('first')
export class FirstController {
  constructor(private readonly firstService: FirstService) {}
}
