import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  PayrollTrackingService,
  FinanceReport,
} from './payroll-tracking.service';

@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(
    private readonly payrollTrackingService: PayrollTrackingService,
  ) {}

  /** Get payslips by department */
  @Get('payslips/:departmentId/:payrollRunId')
  async getPayslipsByDepartment(
    @Param('departmentId') departmentId: string,
    @Param('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollTrackingService.findPaySlipsByDepartment(
      departmentId,
      payrollRunId,
    );
  }

  /** Get payroll runs by month */
  @Get('payroll-runs/month/:month/:year')
  async getPayrollRunsByMonth(
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.payrollTrackingService.findPayrollRunByMonth(month, year);
  }

  /** Get payroll runs by year */
  @Get('payroll-runs/year/:year')
  async getPayrollRunsByYear(@Param('year') year: string) {
    return this.payrollTrackingService.findPayrollRunByYear(year);
  }

  /** Generate finance report for a year */
  @Get('finance-report/:year')
  async generateFinanceReport(
    @Param('year', ParseIntPipe) year: number,
  ): Promise<FinanceReport[]> {
    return this.payrollTrackingService.generateFinanceReportByYear(year);
  }

  /** Approve a dispute */
  @Post('dispute/approve/:disputeId')
  async approveDispute(
    @Param('disputeId') disputeId: string,
    @Body('financeStaffId') financeStaffId: string,
    @Body('refundAmount') refundAmount: number,
  ) {
    return this.payrollTrackingService.approveDispute(
      disputeId,
      financeStaffId,
      refundAmount,
    );
  }

  /** Approve a claim */
  @Post('claim/approve/:claimId')
  async approveClaim(
    @Param('claimId') claimId: string,
    @Body('financeStaffId') financeStaffId: string,
  ) {
    return this.payrollTrackingService.approveClaim(claimId, financeStaffId);
  }
}
