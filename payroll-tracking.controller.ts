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
import { PayrollTrackingService } from './payroll-tracking.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';

@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(
    private readonly payrollTrackingService: PayrollTrackingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPayslipDto: CreatePayslipDto) {
    return this.payrollTrackingService.create(createPayslipDto);
  }

  @Get()
  findAll() {
    return this.payrollTrackingService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.findByEmployeeId(employeeId);
  }

  @Get('payroll-run/:payrollRunId')
  findByPayrollRunId(@Param('payrollRunId') payrollRunId: string) {
    return this.payrollTrackingService.findByPayrollRunId(payrollRunId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollTrackingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayslipDto: UpdatePayslipDto) {
    return this.payrollTrackingService.update(id, updatePayslipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.payrollTrackingService.remove(id);
  }
}

