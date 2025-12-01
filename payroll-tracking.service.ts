import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose'; // ✅ import HydratedDocument
import { paySlip, PayslipDocument as BasePayslipDocument } from '../payroll-execution/Models/payslip.schema';
import PDFDocument from 'pdfkit';
import { PassThrough, Stream } from 'stream';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/Models/employee-profile.schema';
import { payGrade, payGradeDocument } from '../payroll-configuration/Models/payGrades.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../leaves/Models/leave-entitlement.schema';
import { LeaveType, LeaveTypeDocument } from '../leaves/Models/leave-type.schema';
import { allowance, allowanceDocument } from '../payroll-configuration/Models/allowance.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../time-management/Models/attendance-record.schema';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../time-management/Models/attendance-correction-request.schema';
import { LatenessRule, LatenessRuleDocument } from '../time-management/Models/lateness-rule.schema';
import { CorrectionRequestStatus } from '../time-management/Models/enums/index'; 
import { insuranceBrackets, insuranceBracketsDocument } from '../payroll-configuration/Models/insuranceBrackets.schema';
import { refunds, refundsDocument } from './Models/refunds.schema';
import { taxRules,taxRulesDocument } from 'src/payroll-configuration/Models/taxRules.schema';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';
import { disputes,disputesDocument } from './Models/disputes.schema';
import {DisputeStatus}from'./enums/payroll-tracking-enum'
import { claims, claimsDocument } from './Models/claims.schema';
import {ClaimStatus} from'./enums/payroll-tracking-enum'



// Extend the imported PayslipDocument to include timestamps
export type PayslipDocument = BasePayslipDocument & { createdAt: Date; updatedAt: Date };

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(paySlip.name) private readonly payslipModel: Model<PayslipDocument>,
    @InjectModel(EmployeeProfile.name) private readonly employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(payGrade.name) private readonly payGradeModel: Model<payGradeDocument>,
    @InjectModel(LeaveEntitlement.name) private readonly leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveType.name) private readonly leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(allowance.name) private readonly allowanceModel: Model<allowanceDocument>,
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(AttendanceCorrectionRequest.name) private correctionModel: Model<AttendanceCorrectionRequestDocument>,
    @InjectModel(LatenessRule.name) private latenessRuleModel: Model<LatenessRuleDocument>,
    @InjectModel(insuranceBrackets.name)private insuranceBracketModel: Model<insuranceBracketsDocument>,
    @InjectModel(refunds.name) private readonly refundModel: Model<refundsDocument>,
    @InjectModel(taxRules.name) private readonly taxRulesModel: Model<taxRulesDocument>, 
    @InjectModel(disputes.name) private readonly disputeModel: Model<disputesDocument>,
    @InjectModel(claims.name) private readonly claimsModel: Model<claimsDocument>,

  ) {}

  // employee view their most recent payslip
async viewMyPayslip(userId: string): Promise<paySlip> {
    const payslip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // most recent first
      .exec();
  
    if (!payslip) throw new NotFoundException('No payslip available');
  
    return payslip;
  }

  

  
 //employee downloads his/her payslip for the current month(REQ-PY-1)

 async downloadRecentPayslipPdf(userId: string): Promise<Stream> {
    // Find the most recent payslip
    const payslip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // latest first
      .exec();
  
    if (!payslip) throw new NotFoundException('No payslip available');
  
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);
  
    // Header
    doc.fontSize(22).text('Payslip', { align: 'center', underline: true });
    doc.moveDown();
  
    // Employee Info
    doc.fontSize(14).text(`Employee ID: ${payslip.employeeId}`, { continued: true });
    doc.text(`\tPayslip ID: ${payslip._id}`);
    doc.text(`Date: ${payslip.createdAt?.toDateString() ?? 'N/A'}`);
    doc.moveDown();
  
    // Salary Details
    doc.fontSize(16).text('Salary Details', { underline: true });
    doc.moveDown(0.5);
    const salaryDetails: Record<string, any> = {
        'Payroll Run ID': payslip.payrollRunId ?? 'N/A',
        'Total Gross Salary': `$${Number(payslip.totalGrossSalary ?? 0).toFixed(2)}`,
        'Total Deductions': `$${Number(payslip.totaDeductions ?? 0).toFixed(2)}`, // use 'totaDeductions'
        'Net Pay': `$${Number(payslip.netPay ?? 0).toFixed(2)}`,
        'Payment Status': payslip.paymentStatus ?? 'Unknown',
      };
      
  
    Object.entries(salaryDetails).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
      doc.moveDown(0.3);
    });
  
    // Footer
    doc.moveDown();
    doc.fontSize(10).text('This is a system-generated payslip.', { align: 'center' });
  
    doc.end();
    return stream;
  }
  
  

// Employee can view the status and key details of their payslip(REQ-PY-2)
async getMyPayslipStatus(userId: string) {
    const payslip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  
    if (!payslip) throw new NotFoundException('No payslip found');
  
    return {
      payrollRunId: payslip.payrollRunId ?? 'N/A',
      totalGrossSalary: `$${Number(payslip.totalGrossSalary ?? 0).toFixed(2)}`,
      totalDeductions: `$${Number(payslip.totaDeductions ?? 0).toFixed(2)}`,
      netPay: `$${Number(payslip.netPay ?? 0).toFixed(2)}`,
      paymentStatus: payslip.paymentStatus ?? 'Unknown',
      month: payslip.createdAt ? payslip.createdAt.getMonth() + 1 : 'N/A',
      year: payslip.createdAt ? payslip.createdAt.getFullYear() : 'N/A',
      createdAt: payslip.createdAt?.toDateString() ?? 'N/A',
      updatedAt: payslip.updatedAt?.toDateString() ?? 'N/A',
    };
  }
  
  
// Employee views their base salary according to employment contract (req-py-3)
async viewBaseSalary(userId: string) {
    // 1. Find the employee
    const employee = await this.employeeModel.findById(userId).exec();
    if (!employee) throw new NotFoundException('Employee not found');
  
    // 2. Check if the employee has a pay grade assigned
    if (!employee.payGradeId) throw new NotFoundException('Pay grade not assigned for employee');
  
    // 3. Populate pay grade
    const payGrade = await this.payGradeModel
    .findOne({ _id: new Types.ObjectId(employee.payGradeId) })
    .exec();
      if (!payGrade) throw new NotFoundException('Pay grade not found');
  
    // 4. Determine multiplier based on contract type and work type
    let multiplier = 1; // default: full salary
  
    // Adjust based on contract type
    switch (employee.contractType) {
      case 'PART_TIME_CONTRACT':
        multiplier *= 0.5; // example: part-time gets 50%
        break;
      case 'FULL_TIME_CONTRACT':
        multiplier *= 1;
        break;
      default:
        multiplier *= 1; // other contract types default to full
    }
  
    // Adjust further based on work type if needed
    switch (employee.workType) {
      case 'PART_TIME':
        multiplier *= 0.5; // halve the base if work type is part-time
        break;
      case 'FULL_TIME':
        multiplier *= 1;
        break;
      default:
        multiplier *= 1;
    }
  
    // 5. Calculate adjusted base salary
    const calculatedBaseSalary = Number(payGrade.baseSalary ?? 0) * multiplier;
    const calculatedGrossSalary = Number(payGrade.grossSalary ?? 0) * multiplier;
  
    // 6. Return results
    return {
      baseSalary: calculatedBaseSalary,
      grossSalary: calculatedGrossSalary,
      contractType: employee.contractType ?? 'N/A',
      workType: employee.workType ?? 'N/A',
      multiplier, // optional: show how it was calculated
    };
  }

  
  // Employee views compensation for unused/encashed leave (REQ-PY-5)
  async viewUnusedLeaveCompensation(userId: string) {
    // 1. Get the employee
    const employee = await this.employeeModel.findById(userId).exec();
    if (!employee) throw new NotFoundException('Employee not found');

    // 2. Get pay grade and base salary
    if (!employee.payGradeId) throw new NotFoundException('Pay grade not assigned');
    const payGrade = await this.payGradeModel.findById(employee.payGradeId).exec();
    if (!payGrade) throw new NotFoundException('Pay grade not found');

    // Assume 22 working days per month for daily rate calculation
    const dailyRate = Number(payGrade.baseSalary ?? 0) / 22;

    // 3. Get all paid leave types
    const paidLeaveTypes = await this.leaveTypeModel.find({ paid: true }).exec();

    // 4. For each leave type, get remaining leave for the employee
    const entitlements = await this.leaveEntitlementModel.find({
      employeeId: userId,
      leaveTypeId: { $in: paidLeaveTypes.map(l => l._id) },
    }).exec();

    // 5. Calculate encashable amount for each leave type
    const leaveCompensation = entitlements.map(ent => {
      const leaveType = paidLeaveTypes.find(l => l._id.equals(ent.leaveTypeId));
      const remainingDays = ent.remaining ?? 0;
      const compensation = dailyRate * remainingDays;
      return {
        leaveType: leaveType?.name ?? 'Unknown',
        remainingDays,
        dailyRate,
        compensation: Number(compensation.toFixed(2)),
      };
    });

    // 6. Total compensation
    const totalCompensation = leaveCompensation.reduce((sum, l) => sum + l.compensation, 0);

    return {
      leaveCompensation,
      totalCompensation: Number(totalCompensation.toFixed(2)),
    };
  }





 // Employee views transportation/commuting allowances
 async viewTransportationCompensation(userId: string) {
    // 1. Get the employee
    const employee = await this.employeeModel.findById(userId).exec();
    if (!employee) throw new NotFoundException('Employee not found');

    // 2. Find all approved allowances related to transportation/commuting
    const transportAllowances = await this.allowanceModel.find({
      status: 'APPROVED', // only include approved allowances
      name: { $regex: /transport|commute/i }, // case-insensitive match
    }).exec();

    if (!transportAllowances.length) {
      return {
        message: 'No transportation or commuting allowances found',
        totalAmount: 0,
        allowances: [],
      };
    }

    // 3. Calculate total amount
    const totalAmount = transportAllowances.reduce((sum, a) => sum + a.amount, 0);

    // 4. Return detailed breakdown
    const allowances = transportAllowances.map(a => ({
      name: a.name,
      amount: a.amount,
    }));

    return {
      totalAmount,
      allowances,
    };
  }



//View detailed tax deductions (REQ-PY-8)
  async viewDetailedTaxDeductions(userId: string, payslipId: string) {
    // Fetch the payslip
    const payslip = await this.payslipModel.findById(payslipId).exec();
    if (!payslip) throw new NotFoundException('Payslip not found');
  
    // Authorization check
    if (payslip.employeeId.toString() !== userId) {
      throw new ForbiddenException('You cannot view this payslip');
    }
  
    const baseSalary = payslip.earningsDetails?.baseSalary ?? 0;
    const taxes = payslip.deductionsDetails?.taxes ?? [];
  
    // Map all taxes to detailed info
    const detailedTaxes = taxes.map(tax => ({
      name: tax.name,                  // e.g., Income tax, Social contribution
      amount: baseSalary * (tax.rate / 100), // compute deduction
      lawReference: tax.description ?? 'Not specified', // use description as rule applied
      rate: tax.rate
    }));
  
    const totalTax = detailedTaxes.reduce((sum, t) => sum + t.amount, 0);
  
    return {
      totalTax,
      taxes: detailedTaxes,
    };
  }


  
  
 // view insurance deductions(REQ-PY-9)
 async viewInsuranceDeductions(employeeId: string) {
    // 1. Fetch employee with salary
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate<{ payGradeId: { baseSalary: number } }>('payGradeId')
      .exec();
  
    if (!employee) throw new Error('Employee not found');
  
    const baseSalary = employee?.payGradeId?.baseSalary ?? 0;
  
    // 2. Fetch applicable insurance brackets
    const insuranceBrackets = await this.insuranceBracketModel
      .find({
        status: 'APPROVED',
        minSalary: { $lte: baseSalary },
        maxSalary: { $gte: baseSalary },
      })
      .exec();
  
    // 3. Compute itemized contributions
    const insurances = insuranceBrackets.map((ib) => ({
      name: ib.name,
      employeeContribution: +(baseSalary * (ib.employeeRate / 100)).toFixed(2),
      employerContribution: +(baseSalary * (ib.employerRate / 100)).toFixed(2),
      total: +(baseSalary * ((ib.employeeRate + ib.employerRate) / 100)).toFixed(2),
      employeeRate: ib.employeeRate,
      employerRate: ib.employerRate,
    }));
  
    // 4. Totals
    const totalEmployee = insurances.reduce((sum, i) => sum + i.employeeContribution, 0);
    const totalEmployer = insurances.reduce((sum, i) => sum + i.employerContribution, 0);
    const total = totalEmployee + totalEmployer;
  
    return {
      baseSalary,
      totalEmployee,
      totalEmployer,
      total,
      insurances, // itemized
    };
  }
  

  

//View any salary deductions due to misconduct or unapproved absenteeism (REQ-PY-10)
async calculateMisconductAbsenceDeductions(employeeId: string) {
    const deductions: { reason: string; amount: number }[] = [];
  
    // 1. Fetch attendance records for this employee
    const records = await this.attendanceModel.find({ employeeId }).exec();
  
    // 2. Fetch lateness rule (assuming only 1 active rule)
    const latenessRule = await this.latenessRuleModel.findOne().exec();
  
    // 3. Fetch approved correction requests for this employee
    const corrections: AttendanceCorrectionRequest[] = await this.correctionModel.find({
      employeeId,
      status: CorrectionRequestStatus.APPROVED,
    }).exec();
  
    // 4. Fetch employee base salary
    const employee: any = await this.employeeModel.findById(employeeId).populate('payGradeId').exec();
    const baseSalary = employee?.payGradeId?.baseSalary ?? 0;
    const dailyRate = baseSalary / 22; // assume 22 working days per month
  
    for (const record of records) {
      const recordId = (record as any)._id || record['id'];
  
      const hasApprovedCorrection = corrections.some(c =>
        c.attendanceRecord &&
        recordId &&
        new Types.ObjectId(c.attendanceRecord.toString()).equals(new Types.ObjectId(recordId.toString()))
      );
  
      // Unapproved absenteeism (full-day deduction)
      if (record.hasMissedPunch && !hasApprovedCorrection) {
        deductions.push({
          reason: 'Unapproved absenteeism',
          amount: dailyRate,
        });
      }
  
      // Lateness deduction
      if (latenessRule && record.totalWorkMinutes < 480) {
        const minutesLate = Math.max(0, 480 - record.totalWorkMinutes - (latenessRule.gracePeriodMinutes ?? 0));
        if (minutesLate > 0) {
          const lateDeduction = minutesLate * (latenessRule.deductionForEachMinute ?? 0);
          deductions.push({
            reason: `Lateness (${minutesLate} min)`,
            amount: lateDeduction,
          });
        }
      }
    }
  
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  
    return {
      totalDeductions,
      details: deductions,
    };
  }
  
  
  




// see the salary deduction for unpaid leave days(REQ-PY-11)
async calculateUnpaidLeaveDeductions(employeeId: string) {
    // 1. Fetch the employee + pay grade
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate('payGradeId')
      .exec();
  
    if (!employee) throw new Error('Employee not found');
  
    // 2. Get base salary and daily rate

    const payGrade: any = employee.payGradeId;
    const baseSalary = payGrade?.baseSalary ?? 0;
    const dailyRate = baseSalary / 22; // assume 22 working days/month
  
    // 3. Fetch employee leave entitlements
    const entitlements = await this.leaveEntitlementModel
      .find({ employeeId })
      .exec();
  
    // 4. Fetch only deductible leave types
    const leaveTypes = await this.leaveTypeModel
      .find({ deductible: true })
      .exec();
  
    // 5. Filter unpaid leave & calculate deductions
    const details = entitlements
      .filter(ent => {
        const leaveType = leaveTypes.find(l => l._id.equals(ent.leaveTypeId));
        return leaveType && !leaveType.paid; // unpaid leaves only
      })
      .map(ent => {
        const leaveType = leaveTypes.find(l => l._id.equals(ent.leaveTypeId));
        const daysTaken = ent.taken ?? 0;
        const amount = daysTaken * dailyRate;
        return {
          leaveType: leaveType?.name ?? 'Unknown',
          daysTaken,
          dailyRate,
          amount: Number(amount.toFixed(2)),
        };
      });
  
    const totalDeductions = details.reduce((sum, d) => sum + d.amount, 0);
  
    return {
      totalDeductions,
      details,
    };
  }
  


//get salary history(REQ-PY-13)
async getSalaryHistory(userId: string) {
    // Fetch the last 12 payslips, newest first
    const payslips = await this.payslipModel
      .find({ employeeId: userId })
      .sort({ createdAt: -1 }) // newest first
      .limit(12)
      .exec();
  
    if (!payslips.length) {
      throw new NotFoundException('No payslips found for this employee.');
    }
  
    // Map payslips to simplified output
    return payslips.map(p => ({
      payslipId: p._id.toString(),
      payrollRunId: p.payrollRunId ?? 'N/A',
      totalGrossSalary: `$${Number(p.totalGrossSalary ?? 0).toFixed(2)}`,
      totalDeductions: `$${Number(p.totaDeductions ?? 0).toFixed(2)}`,
      netPay: `$${Number(p.netPay ?? 0).toFixed(2)}`,
      paymentStatus: p.paymentStatus ?? 'Unknown',
      month: p.createdAt ? p.createdAt.getMonth() + 1 : 'N/A', // safe fallback
      year: p.createdAt ? p.createdAt.getFullYear() : 'N/A',
      createdAt: p.createdAt ? p.createdAt.toDateString() : 'N/A',
      updatedAt: p.updatedAt ? p.updatedAt.toDateString() : 'N/A',
    }));
  }
  



 // View employer contributions (insurance, pension, allowances)(req-py-14)
  async viewEmployerContributions(userId: string) {
    // 1. Get the employee
    const employee: any = await this.employeeModel.findById(userId).populate('payGradeId').exec();
    if (!employee) throw new Error('Employee not found');
  
    const baseSalary = employee?.payGradeId?.baseSalary ?? 0;
  
    // 2. Fetch approved insurance brackets applicable to this employee's salary
    const insuranceBrackets = await this.insuranceBracketModel.find({
      status: 'APPROVED',
      minSalary: { $lte: baseSalary },
      maxSalary: { $gte: baseSalary },
    }).exec();
  
    // 3. Calculate employer contributions
    const insuranceContributions = insuranceBrackets.map(ib => ({
      name: ib.name,
      employerContribution: +(baseSalary * (ib.employerRate / 100)).toFixed(2),
      employeeContribution: +(baseSalary * (ib.employeeRate / 100)).toFixed(2),
      total: +(baseSalary * ((ib.employeeRate + ib.employerRate) / 100)).toFixed(2),
      employerRate: ib.employerRate,
      employeeRate: ib.employeeRate,
    }));
  
    const totalEmployerInsurance = insuranceContributions.reduce(
      (sum, i) => sum + i.employerContribution, 
      0
    );
  
    // 4. Fetch approved allowances for this employee
    const allowances = await this.allowanceModel.find({
      status: 'APPROVED',
      employeeId: userId
    }).exec();
  
    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
  
    const allowanceDetails = allowances.map(a => ({
      name: a.name,
      amount: a.amount,
    }));
  
    // 5. Return combined employer contributions
    return {
      baseSalary,
      totalEmployerInsurance,
      totalAllowances,
      totalEmployerContributions: totalEmployerInsurance + totalAllowances,
      insurance: insuranceContributions,
      allowances: allowanceDetails,
    };
  }





async downloadTaxRulesPdf(): Promise<Stream> {
  // Fetch all tax rules (you could filter by status if needed)
  const taxRules = await this.taxRulesModel.find({ status: 'APPROVED' }).exec();
  if (!taxRules.length) throw new NotFoundException('No tax rules available');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Header
  doc.fontSize(22).text('Tax Rules', { align: 'center', underline: true });
  doc.moveDown();

  // Table header
  doc.fontSize(14).text(`Name`, { continued: true, width: 200 });
  doc.text(`Rate (%)`, { continued: true, width: 100 });
  doc.text(`Status`, { width: 100 });
  doc.moveDown();

  // Tax rules details
  taxRules.forEach((tax) => {
    doc.fontSize(12).text(tax.name, { continued: true, width: 200 });
    doc.text(`${tax.rate}`, { continued: true, width: 100 });
    doc.text(tax.status, { width: 100 });
    doc.moveDown(0.5);

    if (tax.description) {
      doc.fontSize(10).text(`Description: ${tax.description}`, { indent: 20 });
      doc.moveDown(0.5);
    }
  });

  // Footer
  doc.moveDown();
  doc.fontSize(10).text('This is a system-generated tax document.', { align: 'center' });

  doc.end();
  return stream;
}
  






async submitExpenseClaim(
  userId: string,
  description: string,
  claimType: string,
  amount: number
): Promise<{ message: string; claimId: string; status: ClaimStatus }> {
  // 1. Validate employee exists
  const employee = await this.employeeModel.findById(userId).exec();
  if (!employee) throw new NotFoundException('Employee not found');

  // 2. Generate a unique claimId
  const count = await this.claimsModel.countDocuments().exec();
  const claimId = `CLAIM-${(count + 1).toString().padStart(4, '0')}`;

  // 3. Create the claim
  const claim = new this.claimsModel({
    claimId,
    description,
    claimType,
    amount,
    employeeId: new Types.ObjectId(userId),
    status: ClaimStatus.UNDER_REVIEW,
  });

  await claim.save();

  return {
    message: 'Expense claim submitted successfully',
    claimId: claim.claimId,
    status: claim.status,
  };
}



async getMyClaims(userId: string) {
  const claims = await this.claimsModel
    .find({ employeeId: userId })
    .sort({ createdAt: -1 })
    .exec();

  if (!claims.length) {
    return { message: 'No claims found', claims: [] };
  }

  return claims.map(c => ({
    claimId: c.claimId,
    description: c.description,
    claimType: c.claimType,
    amount: c.amount,
    approvedAmount: c.approvedAmount ?? null,
    status: c.status,
    rejectionReason: c.rejectionReason ?? null,
    resolutionComment: c.resolutionComment ?? null,
   
  }));
}


async getMyDisputes(userId: string) {
  const disputes = await this.disputeModel
    .find({ employeeId: userId })
    .sort({ createdAt: -1 })
    .exec();

  if (!disputes.length) {
    return { message: 'No disputes found', disputes: [] };
  }

  return disputes.map(d => ({
    disputeId: d.disputeId,
    description: d.description,
    status: d.status,
    rejectionReason: d.rejectionReason ?? null,
    resolutionComment: d.resolutionComment ?? null,
    payrollSpecialistId: d.payrollSpecialistId ?? null,
    payrollManagerId: d.payrollManagerId ?? null,
    financeStaffId: d.financeStaffId ?? null,
   
  }));
}





}
