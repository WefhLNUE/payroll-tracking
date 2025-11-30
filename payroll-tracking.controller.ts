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

  /** PHASE 3: DISPUTES AND CLAIM APPROVAL/REJECTION ENDPOINTS */

  /** Get disputes for payroll specialist review */
  @Get('disputes/for-specialist-review')
  async getDisputesForSpecialistReview() {
    return this.payrollTrackingService.getDisputesForSpecialistReview();
  }

  /** Get claims for payroll specialist review */
  @Get('claims/for-specialist-review')
  async getClaimsForSpecialistReview() {
    return this.payrollTrackingService.getClaimsForSpecialistReview();
  }

  /** Get disputes pending manager approval */
  @Get('disputes/for-manager-approval')
  async getDisputesForManagerApproval() {
    return this.payrollTrackingService.getDisputesForManagerApproval();
  }

  /** Get claims pending manager approval */
  @Get('claims/for-manager-approval')
  async getClaimsForManagerApproval() {
    return this.payrollTrackingService.getClaimsForManagerApproval();
  }

  /** Get approved records for finance staff visibility */
  @Get('finance/approved-records')
  async getApprovedRecordsForFinance() {
    return this.payrollTrackingService.getApprovedRecordsForFinance();
  }

  /** Payroll Specialist: Approve dispute */
  @Post('dispute/:disputeId/specialist-approve')
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

  /** Payroll Specialist: Approve expense claim */
  @Post('claim/:claimId/specialist-approve')
  async specialistApproveClaim(
    @Param('claimId') claimId: string,
    @Body('payrollSpecialistId') payrollSpecialistId: string,
    @Body('approvedAmount') approvedAmount?: number,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.specialistApproveClaim(
      claimId,
      payrollSpecialistId,
      approvedAmount,
      comments,
    );
  }

  /** Payroll Specialist: Reject expense claim */
  @Post('claim/:claimId/specialist-reject')
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
  async managerConfirmClaim(
    @Param('claimId') claimId: string,
    @Body('payrollManagerId') payrollManagerId: string,
    @Body('comments') comments?: string,
  ) {
    return this.payrollTrackingService.managerConfirmClaimApproval(
      claimId,
      payrollManagerId,
      comments,
    );
  }

  /** PHASE 4: REFUND PROCESS ENDPOINTS */

  /** Finance Staff: Get all pending refunds */
  @Get('refunds/pending')
  async getPendingRefunds() {
    return this.payrollTrackingService.getPendingRefunds();
  }

  /** Finance Staff: Mark refund as paid (when processed in payroll) */
  @Post('refund/:refundId/mark-paid')
  async markRefundAsPaid(
    @Param('refundId') refundId: string,
    @Body('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollTrackingService.markRefundAsPaid(refundId, payrollRunId);
  }

  /** Get refunds by payroll run */
  @Get('refunds/payroll-run/:payrollRunId')
  async getRefundsByPayrollRun(@Param('payrollRunId') payrollRunId: string) {
    return this.payrollTrackingService.getRefundsByPayrollRun(payrollRunId);
  }

  /** EMPLOYEE SELF-SERVICE ENDPOINTS */

  /** Employee: View my disputes */
@Get('employee/:employeeId/disputes')
async getEmployeeDisputes(@Param('employeeId') employeeId: string) {
  // Use a method that gets ALL disputes for the employee
  return await this.payrollTrackingService.getEmployeeDisputes(employeeId);
}

/** Employee: View my claims */
@Get('employee/:employeeId/claims')
async getEmployeeClaims(@Param('employeeId') employeeId: string) {
  // Use a method that gets ALL claims for the employee
  return await this.payrollTrackingService.getEmployeeClaims(employeeId);
}

  /** Employee: View my refunds */
  @Get('employee/:employeeId/refunds')
  async getEmployeeRefunds(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getEmployeeRefunds(employeeId);
  }

  /** OPERATIONAL REPORTS ENDPOINTS */

  /** Generate payroll summary by department */
  @Get('reports/department-summary/:departmentId/:year/:month')
  async getDepartmentSummary(
    @Param('departmentId') departmentId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    // This would generate a detailed payroll summary for a department
    // Implementation depends on your specific reporting requirements
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
