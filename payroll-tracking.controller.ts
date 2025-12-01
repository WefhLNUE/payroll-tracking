import { Controller, UseGuards,Get,Query,Req,Res, Post,Body} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PayrollTrackingService } from './payroll-tracking.service';
import type { Response } from 'express';
import { refunds, refundsDocument } from './Models/refunds.schema';


import { Roles } from 'src/auth/decorator/roles.decorator';
import { SystemRole } from 'src/employee-profile/enums/employee-profile.enums';
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


}
