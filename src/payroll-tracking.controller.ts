import { Controller, Get, Param } from '@nestjs/common';
import { PayrollTrackingService } from './payroll-tracking.service';

@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(private service: PayrollTrackingService) {}

  @Get('payslips/:employeeId')
  getPayslips(@Param('employeeId') employeeId: string) {
    return this.service.getPayslips(employeeId);
  }

  @Get('expense-claims/:employeeId')
  getExpenseClaims(@Param('employeeId') employeeId: string) {
    return this.service.getExpenseClaims(employeeId);
  }

  @Get('disputes/:employeeId')
  getDisputes(@Param('employeeId') employeeId: string) {
    return this.service.getDisputes(employeeId);
  }

  @Get('compensations/:employeeId')
  getCompensations(@Param('employeeId') employeeId: string) {
    return this.service.getCompensations(employeeId);
  }

  @Get('salary/:employeeId')
  getSalary(@Param('employeeId') employeeId: string) {
    return this.service.getSalary(employeeId);
  }
}
