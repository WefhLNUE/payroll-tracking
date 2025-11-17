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
import { EmployeeCompensationService } from './employee-compensation.service';
import { CreateEmployeeCompensationDto } from './dto/create-employee-compensation.dto';
import { UpdateEmployeeCompensationDto } from './dto/update-employee-compensation.dto';

@Controller('employee-compensations')
export class EmployeeCompensationController {
  constructor(
    private readonly employeeCompensationService: EmployeeCompensationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateEmployeeCompensationDto) {
    return this.employeeCompensationService.create(createDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.employeeCompensationService.findByStatus(status);
    }
    return this.employeeCompensationService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.employeeCompensationService.findByEmployeeId(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeCompensationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmployeeCompensationDto,
  ) {
    return this.employeeCompensationService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.employeeCompensationService.remove(id);
  }
}

