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
} from '@nestjs/common';
import { EmployeeSalaryService } from './employee-salary.service';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';

@Controller('employee-salaries')
export class EmployeeSalaryController {
  constructor(private readonly employeeSalaryService: EmployeeSalaryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateEmployeeSalaryDto) {
    return this.employeeSalaryService.create(createDto);
  }

  @Get()
  findAll() {
    return this.employeeSalaryService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.employeeSalaryService.findByEmployeeId(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeSalaryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEmployeeSalaryDto) {
    return this.employeeSalaryService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.employeeSalaryService.remove(id);
  }
}

