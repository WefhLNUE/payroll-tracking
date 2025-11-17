import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';

@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDisputeDto: CreateDisputeDto) {
    return this.disputeService.create(createDisputeDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.disputeService.findByStatus(status);
    }
    return this.disputeService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.disputeService.findByEmployeeId(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disputeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDisputeDto: UpdateDisputeDto) {
    return this.disputeService.update(id, updateDisputeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.disputeService.remove(id);
  }
}

