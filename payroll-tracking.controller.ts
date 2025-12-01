import { Controller } from '@nestjs/common';
import { UseGuards,Get,Query,Req,Res, Post,Body} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PayrollTrackingService } from './payroll-tracking.service';
import type { Response } from 'express';
import { refunds, refundsDocument } from './Models/refunds.schema';
import {
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  FinanceReport,
} from './payroll-tracking.service';
import { Roles } from '../auth/decorator/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll-tracking')
export class PayrollTrackingController {
    constructor(private readonly payrollTrackingService:PayrollTrackingService) {}



    @Get('my-payslip')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async viewMyPayslip(@Req() req) {
  const userId = req.user.id; // automatically from JWT
  return this.payrollTrackingService.viewMyPayslip(userId);
}


@Get('download-payslip')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async downloadMyPayslip(@Req() req, @Res() res: Response) {
  const userId = req.user.id;
  const stream = await this.payrollTrackingService.downloadRecentPayslipPdf(userId);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=payslip.pdf',
  });

  stream.pipe(res);
}



@Get('my-payslip-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async getMyPayslipStatus(@Req() req) {
  const userId = req.user.id; // automatically from JWT
  return this.payrollTrackingService.getMyPayslipStatus(userId);
}


@Get('base-salary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewBaseSalary(@Req() req) {
    const userId = req.user.id; // automatically from JWT
    return this.payrollTrackingService.viewBaseSalary(userId);
  }


  @Get('unused-leave-compensation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewUnusedLeaveCompensation(@Req() req) {
    const userId = req.user.id; // automatically from JWT
    return this.payrollTrackingService.viewUnusedLeaveCompensation(userId);
  }


  @Get('transport-compensation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewTransportationCompensation(@Req() req) {
    const userId = req.user.id; // automatically from JWT
    return this.payrollTrackingService.viewTransportationCompensation(userId);
  }



  @Get('tax-deductions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewDetailedTaxDeductions(
    @Req() req,
    @Query('payslipId') payslipId: string,
  ) {
    const userId = req.user.id; // automatically from JWT
    return this.payrollTrackingService.viewDetailedTaxDeductions(userId, payslipId);
  }



  @Get('insurance-deductions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewInsuranceDeductions(@Req() req) {
    const userId = req.user.id; // automatically from JWT
    return this.payrollTrackingService.viewInsuranceDeductions(userId);
  }


  @Get('misconduct-deductions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewMisconductDeductions(@Req() req, @Res() res: Response) {
    const employeeId = req.user.id; // from JWT
    try {
      const result = await this.payrollTrackingService.calculateMisconductAbsenceDeductions(employeeId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @Get('unpaid-leave-deductions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async viewUnpaidLeaveDeductions(@Req() req) {
    const employeeId = req.user.id;
    return this.payrollTrackingService.calculateUnpaidLeaveDeductions(employeeId);
  }
  



  @Get('salary-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async getMySalaryHistory(@Req() req) {
    const userId = req.user.id; // extracted from JWT automatically
    return this.payrollTrackingService.getSalaryHistory(userId);
  }
  

  @Get('employer-contributions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async viewEmployerContributions(@Req() req) {
  const userId = req.user.id; // from JWT
  return this.payrollTrackingService.viewEmployerContributions(userId);
}


@Get('download-tax-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async downloadTaxRules(@Res() res: Response) {
  const stream = await this.payrollTrackingService.downloadTaxRulesPdf();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=tax-rules.pdf',
  });

  stream.pipe(res);
}

@Post('expense-claims')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async submitExpenseClaim(
  @Req() req,
  @Body() body: { description: string; claimType: string; amount: number }
) {
  const userId = req.user.id; // Extracted automatically from JWT
  const { description, claimType, amount } = body;

  return this.payrollTrackingService.submitExpenseClaim(
    userId,
    description,
    claimType,
    amount
  );
}


@Post('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async submitPayrollDispute(
  @Req() req,
  @Body() body: { payslipId: string; description: string },
) {
  const userId = req.user.id;
  const { payslipId, description } = body;

  return this.payrollTrackingService.submitPayrollDispute(
    userId,
    payslipId,
    description,
  );
}


// View all claims for the logged-in employee
@Get('my-claims')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async getMyClaims(@Req() req) {
  const userId = req.user.id;
  return this.payrollTrackingService.getMyClaims(userId);
}

// View all disputes for the logged-in employee
@Get('my-disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
async getMyDisputes(@Req() req) {
  const userId = req.user.id;
  return this.payrollTrackingService.getMyDisputes(userId);
}

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
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER, SystemRole.FINANCE_STAFF)
  async getPayrollRunsByMonth(
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.payrollTrackingService.findPayrollRunByMonth(month, year);
  }

  /** Get payroll runs by year */
  @Get('payroll-runs/year/:year')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER, SystemRole.FINANCE_STAFF)
  async getPayrollRunsByYear(@Param('year') year: string) {
    return this.payrollTrackingService.findPayrollRunByYear(year);
  }

  /** Generate finance report for a year */
  @Get('finance-report/:year')
  @Roles(SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  async generateFinanceReport(
    @Param('year', ParseIntPipe) year: number,
  ): Promise<FinanceReport[]> {
    return this.payrollTrackingService.generateFinanceReportByYear(year);
  }

  /** PHASE 3: DISPUTES AND CLAIM APPROVAL/REJECTION ENDPOINTS */

  /** Get disputes for payroll specialist review */
  @Get('disputes/for-specialist-review')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getDisputesForSpecialistReview() {
    return this.payrollTrackingService.getDisputesForSpecialistReview();
  }

  /** Get claims for payroll specialist review */
  @Get('claims/for-specialist-review')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getClaimsForSpecialistReview() {
    return this.payrollTrackingService.getClaimsForSpecialistReview();
  }

  /** Get disputes pending manager approval */
  @Get('disputes/for-manager-approval')
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  async getDisputesForManagerApproval() {
    return this.payrollTrackingService.getDisputesForManagerApproval();
  }

  /** Get claims pending manager approval */
  @Get('claims/for-manager-approval')
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  async getClaimsForManagerApproval() {
    return this.payrollTrackingService.getClaimsForManagerApproval();
  }

  /** Get approved records for finance staff visibility */
  @Get('finance/approved-records')
  @Roles(SystemRole.FINANCE_STAFF)
  async getApprovedRecordsForFinance() {
    return this.payrollTrackingService.getApprovedRecordsForFinance();
  }

  /** Payroll Specialist: Approve dispute */
  @Post('dispute/:disputeId/specialist-approve')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async specialistApproveDispute(
    @Param('disputeId') disputeId: string,
    @Body('payrollSpecialistId') payrollSpecialistId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.specialistApproveDispute(
      disputeId,
      payrollSpecialistId,
      payrollManagerId,
      comments,
    );
  }

  /** Payroll Specialist: Reject dispute */
  @Post('dispute/:disputeId/specialist-reject')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async specialistRejectDispute(
    @Param('disputeId') disputeId: string,
    @Body('payrollSpecialistId') payrollSpecialistId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.specialistRejectDispute(
      disputeId,
      payrollSpecialistId,
      rejectionReason,
      comments,
    );
  }

  /** Payroll Manager: Confirm dispute approval */
  @Post('dispute/:disputeId/manager-confirm')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async managerConfirmDispute(
    @Param('disputeId') disputeId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('financeStaffId') financeStaffId: string,
    @Body('refundAmount') refundAmount: number,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.managerConfirmDisputeApproval(
      disputeId,
      payrollManagerId,
      financeStaffId,
      refundAmount,
      comments,
    );
  }

  /** Payroll Manager: Reject dispute */
  @Post('dispute/:disputeId/manager-reject')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async managerRejectDispute(
    @Param('disputeId') disputeId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.managerRejectDispute(
      disputeId,
      payrollManagerId,
      rejectionReason,
      comments,
    );
  }

  /** Payroll Specialist: Approve expense claim */
  @Post('claim/:claimId/specialist-approve')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async specialistApproveClaim(
    @Param('claimId') claimId: string,
    @Body('payrollSpecialistId') payrollSpecialistId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('approvedAmount') approvedAmount?: number,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.specialistApproveClaim(
      claimId,
      payrollSpecialistId,
      payrollManagerId,
      approvedAmount,
      comments,
    );
  }

  /** Payroll Specialist: Reject expense claim */
  @Post('claim/:claimId/specialist-reject')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async specialistRejectClaim(
    @Param('claimId') claimId: string,
    @Body('payrollSpecialistId') payrollSpecialistId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.specialistRejectClaim(
      claimId,
      payrollSpecialistId,
      rejectionReason,
      comments,
    );
  }

  /** Payroll Manager: Confirm claim approval */
  @Post('claim/:claimId/manager-confirm')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async managerConfirmClaim(
    @Param('claimId') claimId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('financeStaffId') financeStaffId: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.managerConfirmClaimApproval(
      claimId,
      payrollManagerId,
      financeStaffId,
      comments,
    );
  }

  /** Payroll Manager: Reject claim */
  @Post('claim/:claimId/manager-reject')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async managerRejectClaim(
    @Param('claimId') claimId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.managerRejectClaim(
      claimId,
      payrollManagerId,
      rejectionReason,
      comments,
    );
  }

  /** Finance Staff: Create refund for approved dispute or claim */
  @Post('refund/create')
  @Roles(SystemRole.FINANCE_STAFF)
  async createRefund(
    @Body('type') type: 'dispute' | 'claim',
    @Body('recordId') recordId: string,
    @Body('financeStaffId') financeStaffId: string,
    @Body('refundAmount') refundAmount: number,
    @Body('description') description?: string,
  ) {
    return this.payrollTrackingService.createRefund(
      type,
      recordId,
      financeStaffId,
      refundAmount,
      description,
    );
  }

  /** PHASE 4: REFUND PROCESS ENDPOINTS */

  /** Finance Staff: Get all pending refunds */
  @Get('refunds/pending')
  @Roles(SystemRole.FINANCE_STAFF)
  async getPendingRefunds() {
    return this.payrollTrackingService.getPendingRefunds();
  }

  /** Finance Staff: Mark refund as paid (when processed in payroll) */
  @Post('refund/:refundId/mark-paid')
  @Roles(SystemRole.FINANCE_STAFF)
  async markRefundAsPaid(
    @Param('refundId') refundId: string,
    @Body('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollTrackingService.markRefundAsPaid(refundId, payrollRunId);
  }

  /** Get refunds by payroll run */
  @Get('refunds/payroll-run/:payrollRunId')
  @Roles(SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER)
  async getRefundsByPayrollRun(@Param('payrollRunId') payrollRunId: string) {
    return this.payrollTrackingService.getRefundsByPayrollRun(payrollRunId);
  }

  /** EMPLOYEE SELF-SERVICE ENDPOINTS */

  /** Employee: View my disputes */
  @Get('employee/:employeeId/disputes')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  async getEmployeeDisputes(@Param('employeeId') employeeId: string) {
    return await this.payrollTrackingService.getEmployeeDisputes(employeeId);
  }

  /** Employee: View my claims */
  @Get('employee/:employeeId/claims')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  async getEmployeeClaims(@Param('employeeId') employeeId: string) {
    return await this.payrollTrackingService.getEmployeeClaims(employeeId);
  }

  /** Employee: View my refunds */
  @Get('employee/:employeeId/refunds')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  async getEmployeeRefunds(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getEmployeeRefunds(employeeId);
  }

  /** OPERATIONAL REPORTS ENDPOINTS */

  /** Generate payroll summary by department */
  @Get('reports/department-summary/:departmentId/:year/:month')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER, SystemRole.FINANCE_STAFF)
  async getDepartmentSummary(
    @Param('departmentId') departmentId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const payrollRuns = await this.payrollTrackingService.findPayrollRunByMonth(month, year);
    const departmentPayslips = await Promise.all(
      payrollRuns.map(run => 
        this.payrollTrackingService.findPaySlipsByDepartment(departmentId, run._id.toString())
      )
    );
    
    return {
      departmentId,
      period: { year, month },
      totalPayrollRuns: payrollRuns.length,
      departmentData: departmentPayslips.flat()
    };
  }

  /** Get dispute statistics */
  @Get('reports/dispute-stats/:year/:month')
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER, SystemRole.FINANCE_STAFF)
  async getDisputeStatistics(
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const disputes = await this.payrollTrackingService.getDisputesForSpecialistReview();
    const approvedDisputes = disputes.filter(d => d.status === 'approved');
    const rejectedDisputes = disputes.filter(d => d.status === 'rejected');
    const pendingDisputes = disputes.filter(d => d.status === 'under review' || d.status === 'pending payroll Manager approval');

    return {
      period: { year, month },
      totalDisputes: disputes.length,
      approved: approvedDisputes.length,
      rejected: rejectedDisputes.length,
      pending: pendingDisputes.length,
      approvalRate: disputes.length > 0 ? (approvedDisputes.length / disputes.length) * 100 : 0
    };
  }

  /** Get claim statistics */
  @Get('reports/claim-stats/:year/:month')
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER, SystemRole.FINANCE_STAFF)
  async getClaimStatistics(
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const claims = await this.payrollTrackingService.getClaimsForSpecialistReview();
    const approvedClaims = claims.filter(c => c.status === 'approved');
    const rejectedClaims = claims.filter(c => c.status === 'rejected');
    const pendingClaims = claims.filter(c => c.status === 'under review' || c.status === 'pending payroll Manager approval');

    const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
    const approvedAmount = approvedClaims.reduce((sum, claim) => sum + (claim.approvedAmount || claim.amount), 0);

    return {
      period: { year, month },
      totalClaims: claims.length,
      approved: approvedClaims.length,
      rejected: rejectedClaims.length,
      pending: pendingClaims.length,
      totalAmountRequested: totalAmount,
      totalAmountApproved: approvedAmount,
      approvalRate: claims.length > 0 ? (approvedClaims.length / claims.length) * 100 : 0
    };
  }
}

