/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose'; // ✅ import HydratedDocument
import {
  paySlip,
  PayslipDocument as BasePayslipDocument,
} from '../payroll-execution/Models/payslip.schema';
import PDFDocument from 'pdfkit';
import { PassThrough, Stream } from 'stream';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee-profile/Models/employee-profile.schema';
import {
  payGrade,
  payGradeDocument,
} from '../payroll-configuration/Models/payGrades.schema';
import {
  LeaveEntitlement,
  LeaveEntitlementDocument,
} from '../leaves/Models/leave-entitlement.schema';
import {
  LeaveType,
  LeaveTypeDocument,
} from '../leaves/Models/leave-type.schema';
import {
  allowance,
  allowanceDocument,
} from '../payroll-configuration/Models/allowance.schema';
import {
  AttendanceRecord,
  AttendanceRecordDocument,
} from '../time-management/Models/attendance-record.schema';
import {
  AttendanceCorrectionRequest,
  AttendanceCorrectionRequestDocument,
} from '../time-management/Models/attendance-correction-request.schema';
import {
  LatenessRule,
  LatenessRuleDocument,
} from '../time-management/Models/lateness-rule.schema';
import { CorrectionRequestStatus } from '../time-management/Models/enums/index';
import {
  insuranceBrackets,
  insuranceBracketsDocument,
} from '../payroll-configuration/Models/insuranceBrackets.schema';
import { refunds, refundsDocument } from './Models/refunds.schema';
import { disputes, disputesDocument } from './Models/disputes.schema';
import { DisputeStatus } from './enums/payroll-tracking-enum';
import { PaySlipPaymentStatus } from 'src/payroll-execution/enums/payroll-execution-enum';
import { claims, claimsDocument } from './Models/claims.schema';
import { ClaimStatus } from './enums/payroll-tracking-enum';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  payrollRuns,
  payrollRunsDocument,
} from 'src/payroll-execution/Models/payrollRuns.schema';
import { refundDetails } from './Models/refunds.schema';
import {
  taxRules,
  taxRulesDocument,
} from '../payroll-configuration/Models/taxRules.schema';

import { RefundStatus } from './enums/payroll-tracking-enum';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from '../employee-profile/Models/employee-system-role.schema';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { NotificationLogDocument } from 'src/time-management/Models/notification-log.schema';


export type PayslipDocument = BasePayslipDocument & {
  createdAt: Date;
  updatedAt: Date;
};

export interface FinanceReport {
  totalTaxes: number;
  totalInsurance: number;
  totalBenefits: number;
  totalAllowances: number;
  totalBonuses: number;
  numberOfEmployees: number;
}

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(paySlip.name) private payslipModel: Model<PayslipDocument>,
    @InjectModel(payrollRuns.name)
    private payrollRunModel: Model<payrollRunsDocument>,
    @InjectModel(disputes.name)
    private disputesModel: Model<disputesDocument>,
    @InjectModel(claims.name)
    private claimsModel: Model<claimsDocument>,
    @InjectModel(refunds.name)
    private refundsModel: Model<refundsDocument>,
    // private readonly notificationService: NotificationService,
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(payGrade.name)
    private readonly payGradeModel: Model<payGradeDocument>,
    @InjectModel(LeaveEntitlement.name)
    private readonly leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowanceDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(AttendanceCorrectionRequest.name)
    private correctionModel: Model<AttendanceCorrectionRequestDocument>,
    @InjectModel(LatenessRule.name)
    private latenessRuleModel: Model<LatenessRuleDocument>,
    @InjectModel(insuranceBrackets.name)
    private insuranceBracketModel: Model<insuranceBracketsDocument>,
    @InjectModel(taxRules.name)
    private readonly taxRulesModel: Model<taxRulesDocument>,
    @InjectModel(disputes.name)
    private readonly disputeModel: Model<disputesDocument>,
    @InjectModel(EmployeeSystemRole.name)
  private readonly employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
  @InjectModel('NotificationLog')
private readonly notificationLogModel: Model<NotificationLogDocument>,
  ) {}

  // employee view their most recent payslip
  async viewMyPayslip(userId: string): Promise<any[]> {
    const payslips = await this.payslipModel
      .find({ employeeId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // most recent first
      .exec();

    // Map _id to payslipId for frontend compatibility
    return payslips.map((payslip) => ({
      ...payslip.toObject(),
      payslipId: payslip._id.toString(),
      month: payslip.createdAt
        ? new Date(payslip.createdAt).getMonth() + 1
        : null,
      year: payslip.createdAt
        ? new Date(payslip.createdAt).getFullYear()
        : null,
      netPay: `$${payslip.netPay.toFixed(2)}`,
      createdAt: payslip.createdAt
        ? new Date(payslip.createdAt).toDateString()
        : new Date().toDateString(),
    }));
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
    doc
      .fontSize(14)
      .text(`Employee ID: ${payslip.employeeId}`, { continued: true });
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
    doc
      .fontSize(10)
      .text('This is a system-generated payslip.', { align: 'center' });

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
    if (!employee.payGradeId)
      throw new NotFoundException('Pay grade not assigned for employee');

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
    const calculatedGrossSalary =
      Number(payGrade.grossSalary ?? 0) * multiplier;

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
    if (!employee.payGradeId)
      throw new NotFoundException('Pay grade not assigned');
    const payGrade = await this.payGradeModel
      .findById(employee.payGradeId)
      .exec();
    if (!payGrade) throw new NotFoundException('Pay grade not found');

    // Assume 22 working days per month for daily rate calculation
    const dailyRate = Number(payGrade.baseSalary ?? 0) / 22;

    // 3. Get all paid leave types
    const paidLeaveTypes = await this.leaveTypeModel
      .find({ paid: true })
      .exec();

    // 4. For each leave type, get remaining leave for the employee
    const entitlements = await this.leaveEntitlementModel
      .find({
        employeeId: userId,
        leaveTypeId: { $in: paidLeaveTypes.map((l) => l._id) },
      })
      .exec();

    // 5. Calculate encashable amount for each leave type
    const leaveCompensation = entitlements.map((ent) => {
      const leaveType = paidLeaveTypes.find((l) =>
        l._id.equals(ent.leaveTypeId),
      );
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
    const totalCompensation = leaveCompensation.reduce(
      (sum, l) => sum + l.compensation,
      0,
    );

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

    // 2. Find all approved allowances related to transportation/commuting for THIS employee
    const transportAllowances = await this.allowanceModel
      .find({
        status: 'APPROVED', // only include approved allowances
        employeeId: userId,
        name: { $regex: /transport|commute/i }, // case-insensitive match
      })
      .exec();

    if (!transportAllowances.length) {
      return {
        message: 'No transportation or commuting allowances found',
        totalAmount: 0,
        allowances: [],
      };
    }

    // 3. Calculate total amount
    const totalAmount = transportAllowances.reduce(
      (sum, a) => sum + a.amount,
      0,
    );

    // 4. Return detailed breakdown
    const allowances = transportAllowances.map((a) => ({
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
    const detailedTaxes = taxes.map((tax) => ({
      name: tax.name, // e.g., Income tax, Social contribution
      amount: baseSalary * (tax.rate / 100), // compute deduction
      lawReference: tax.description ?? 'Not specified', // use description as rule applied
      rate: tax.rate,
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
      total: +(
        baseSalary *
        ((ib.employeeRate + ib.employerRate) / 100)
      ).toFixed(2),
      employeeRate: ib.employeeRate,
      employerRate: ib.employerRate,
    }));

    // 4. Totals
    const totalEmployee = insurances.reduce(
      (sum, i) => sum + i.employeeContribution,
      0,
    );
    const totalEmployer = insurances.reduce(
      (sum, i) => sum + i.employerContribution,
      0,
    );
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
    const corrections: AttendanceCorrectionRequest[] =
      await this.correctionModel
        .find({
          employeeId,
          status: CorrectionRequestStatus.APPROVED,
        })
        .exec();

    // 4. Fetch employee base salary
    const employee: any = await this.employeeModel
      .findById(employeeId)
      .populate('payGradeId')
      .exec();
    const baseSalary = employee?.payGradeId?.baseSalary ?? 0;
    const dailyRate = baseSalary / 22; // assume 22 working days per month

    for (const record of records) {
      const recordId = (record as any)._id || record['id'];

      const hasApprovedCorrection = corrections.some(
        (c) =>
          c.attendanceRecord &&
          recordId &&
          new Types.ObjectId(c.attendanceRecord.toString()).equals(
            new Types.ObjectId(recordId.toString()),
          ),
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
        const minutesLate = Math.max(
          0,
          480 -
            record.totalWorkMinutes -
            (latenessRule.gracePeriodMinutes ?? 0),
        );
        if (minutesLate > 0) {
          const lateDeduction =
            minutesLate * (latenessRule.deductionForEachMinute ?? 0);
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
      .filter((ent) => {
        const leaveType = leaveTypes.find((l) => l._id.equals(ent.leaveTypeId));
        return leaveType && !leaveType.paid; // unpaid leaves only
      })
      .map((ent) => {
        const leaveType = leaveTypes.find((l) => l._id.equals(ent.leaveTypeId));
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
    return payslips.map((p) => ({
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
    const employee: any = await this.employeeModel
      .findById(userId)
      .populate('payGradeId')
      .exec();
    if (!employee) throw new Error('Employee not found');
    const pg = await this.payGradeModel.find().exec();

    console.log('paygrademodel:', pg);
    console.log('Employee found:', {
      employeeId: employee._id?.toString(),
      payGradeId: employee.payGradeId?.toString(),
      payGradePopulated:
        !!employee.payGradeId && typeof employee.payGradeId === 'object',
    });

    // Check if payGradeId exists and is populated
    if (!employee.payGradeId) {
      console.warn('Employee has no payGradeId assigned');
      return {
        baseSalary: 0,
        totalEmployerInsurance: 0,
        totalAllowances: 0,
        totalEmployerContributions: 0,
        insurance: [],
        allowances: [],
        error: 'No pay grade assigned to employee',
      };
    }

    // Handle case where payGradeId is an ObjectId (not populated)
    // Check if it's an ObjectId instance (has toString but no baseSalary or grade property)
    const isObjectId =
      employee.payGradeId &&
      typeof employee.payGradeId === 'object' &&
      employee.payGradeId.toString &&
      !employee.payGradeId.baseSalary &&
      !employee.payGradeId.grade; // payGrade has 'grade' field, ObjectId doesn't

    if (isObjectId) {
      console.warn(
        'PayGradeId is an ObjectId but not populated. Attempting manual fetch...',
        'ObjectId:',
        employee.payGradeId.toString(),
      );
      const payGradeIdString = employee.payGradeId.toString();
      const payGradeDoc = await this.payGradeModel
        .findById(payGradeIdString)
        .exec();
      if (payGradeDoc) {
        employee.payGradeId = payGradeDoc;
        console.log('Manually fetched pay grade:', {
          _id: payGradeDoc._id,
          grade: payGradeDoc.grade,
          baseSalary: payGradeDoc.baseSalary,
        });
      } else {
        console.error(
          'Pay grade document not found in database for ID:',
          payGradeIdString,
        );
        return {
          baseSalary: 0,
          totalEmployerInsurance: 0,
          totalAllowances: 0,
          totalEmployerContributions: 0,
          insurance: [],
          allowances: [],
          error: 'Pay grade document not found',
        };
      }
    }

    const baseSalary = employee?.payGradeId?.baseSalary ?? 0;
    console.log(
      'Base salary from pay grade:',
      baseSalary,
      'Pay grade object:',
      employee.payGradeId,
    );

    if (baseSalary === 0) {
      console.warn(
        'Pay grade exists but baseSalary is 0 or undefined. Pay grade:',
        employee.payGradeId,
      );
    }

    // 2. Fetch approved insurance brackets applicable to this employee's salary
    const insuranceBrackets = await this.insuranceBracketModel
      .find({
        status: 'APPROVED',
        minSalary: { $lte: baseSalary },
        maxSalary: { $gte: baseSalary },
      })
      .exec();

    // 3. Calculate employer contributions
    const insuranceContributions = insuranceBrackets.map((ib) => ({
      name: ib.name,
      amount: +(baseSalary * (ib.employerRate / 100)).toFixed(2), // Map to 'amount' for frontend
      employerContribution: +(baseSalary * (ib.employerRate / 100)).toFixed(2),
      employeeContribution: +(baseSalary * (ib.employeeRate / 100)).toFixed(2),
      total: +(
        baseSalary *
        ((ib.employeeRate + ib.employerRate) / 100)
      ).toFixed(2),
      employerRate: ib.employerRate,
      employeeRate: ib.employeeRate,
    }));

    const totalEmployerInsurance = insuranceContributions.reduce(
      (sum, i) => sum + i.employerContribution,
      0,
    );

    // 4. Fetch approved allowances for this employee
    const allowances = await this.allowanceModel
      .find({
        status: 'APPROVED',
        employeeId: new Types.ObjectId(userId), // Convert to ObjectId
      })
      .exec();

    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);

    const allowanceDetails = allowances.map((a) => ({
      name: a.name,
      amount: a.amount,
    }));

    // 5. Return combined employer contributions - map insurance to use 'amount' field
    const insuranceArray = insuranceContributions.map((ic) => ({
      name: ic.name,
      amount: ic.amount || ic.employerContribution || 0, // Frontend expects 'amount'
    }));

    return {
      baseSalary: baseSalary || 0,
      totalEmployerInsurance: totalEmployerInsurance || 0,
      totalAllowances: totalAllowances || 0,
      totalEmployerContributions:
        (totalEmployerInsurance || 0) + (totalAllowances || 0),
      insurance: insuranceArray.length > 0 ? insuranceArray : [],
      allowances: allowanceDetails.length > 0 ? allowanceDetails : [],
    };
  }

  async downloadTaxRulesPdf(): Promise<Stream> {
    // Fetch all tax rules (you could filter by status if needed)
    const taxRules = await this.taxRulesModel
      .find({ status: 'APPROVED' })
      .exec();
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
        doc
          .fontSize(10)
          .text(`Description: ${tax.description}`, { indent: 20 });
        doc.moveDown(0.5);
      }
    });

    // Footer
    doc.moveDown();
    doc
      .fontSize(10)
      .text('This is a system-generated tax document.', { align: 'center' });

    doc.end();
    return stream;
  }

  async submitExpenseClaim(
    userId: string,
    description: string,
    claimType: string,
    amount: number,
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

    return claims.map((c) => ({
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

    return disputes.map((d) => ({
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

  // Employee submits a payroll dispute linked to a specific payslip
  async submitPayrollDispute(
    userId: string,
    payslipId: string,
    description: string,
  ): Promise<{ message: string; disputeId: string; status: DisputeStatus }> {
    try {
      // Validate payslipId is a valid ObjectId
      if (!Types.ObjectId.isValid(payslipId)) {
        throw new BadRequestException('Invalid payslip ID format');
      }

      // 1. Ensure payslip exists and belongs to this employee
      const payslip = await this.payslipModel.findById(payslipId).exec();
      if (!payslip) {
        throw new NotFoundException('Payslip not found');
      }

      // Compare employeeId properly - both as strings
      const payslipEmployeeId = payslip.employeeId?.toString();
      const userObjectId = userId.toString();

      if (payslipEmployeeId !== userObjectId) {
        throw new ForbiddenException('You cannot dispute this payslip');
      }

      // 2. Generate a human-friendly disputeId
      const count = await this.disputeModel.countDocuments().exec();
      const disputeId = `DISP-${(count + 1).toString().padStart(4, '0')}`;

      // 3. Create dispute in UNDER_REVIEW status
      const dispute = new this.disputeModel({
        disputeId,
        description,
        employeeId: new Types.ObjectId(userId),
        payslipId: payslip._id, // Use the ObjectId from the payslip document
        status: DisputeStatus.UNDER_REVIEW,
      });

      await dispute.save();

      return {
        message: 'Payroll dispute submitted successfully',
        disputeId: dispute.disputeId,
        status: dispute.status,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Log and wrap unknown errors
      console.error('Error submitting dispute:', error);
      throw new InternalServerErrorException(
        `Failed to submit dispute: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /** Find payslips for a department (optional) */
  async findPaySlipsByDepartment(departmentId: string, payrollRunID: string) {
    try {
      const results = await this.payslipModel
        .find({ payrollRunId: payrollRunID })
        .populate({
          path: 'employeeId',
          match: { primaryDepartmentId: departmentId },
          select:
            'firstName lastName email employeeNumber primaryDepartmentId position',
        })
        .populate({
          path: 'payrollRunId',
          select: 'payPeriodStart payPeriodEnd payDate status',
        })
        .lean();

      // Filter out payslips where employee doesn't match department
      const filteredResults = results.filter((p) => p.employeeId);

      // Calculate summary statistics
      const summary = {
        totalPayslips: filteredResults.length,
        totalGrossSalary: filteredResults.reduce(
          (sum, p) => sum + p.totalGrossSalary,
          0,
        ),
        totalDeductions: filteredResults.reduce(
          (sum, p) => sum + (p.totaDeductions || 0),
          0,
        ),
        totalNetPay: filteredResults.reduce((sum, p) => sum + p.netPay, 0),
        paymentStatusBreakdown: {
          pending: filteredResults.filter(
            (p) => (p.paymentStatus || '').toLowerCase() === 'pending',
          ).length,
          paid: filteredResults.filter(
            (p) => (p.paymentStatus || '').toLowerCase() === 'paid',
          ).length,
        },
      };

      return {
        payslips: filteredResults,
        summary,
        departmentId,
        payrollRunId: payrollRunID,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to fetch payslips for department ${departmentId}: ${err.message}`,
      );
    }
  }

  /** Find payroll runs by month */
  async findPayrollRunByMonth(month: string, year: string) {
    try {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (Number.isNaN(m) || Number.isNaN(y) || m < 1 || m > 12) {
        throw new Error(
          `Invalid month/year parameters: month=${month}, year=${year}`,
        );
      }

      // Start at the first day of the month, and end at the last millisecond of the month
      const startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);

      return await this.payrollRunModel
        .find({
          payrollPeriod: { $gte: startDate, $lte: endDate },
        })
        .lean();
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.startsWith('Invalid month/year')
      ) {
        throw new BadRequestException(err.message);
      }
      throw new InternalServerErrorException(
        `Failed to fetch payroll runs: ${err}`,
      );
    }
  }

  /** Find payroll runs by year */
  async findPayrollRunByYear(year: string) {
    try {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);

      return await this.payrollRunModel.find({
        payrollPeriod: { $gte: startDate, $lte: endDate },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to fetch payroll runs by year: ${err}`,
      );
    }
  }

  /** Generate finance report for a year */
  async generateFinanceReportByYear(year: number): Promise<FinanceReport[]> {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const results: FinanceReport[] = await this.payslipModel.aggregate([
        {
          $lookup: {
            from: 'payrollruns',
            localField: 'payrollRunId',
            foreignField: '_id',
            as: 'payrollRun',
          },
        },
        { $unwind: '$payrollRun' },
        {
          $match: {
            'payrollRun.payrollPeriod': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $lookup: {
            from: 'employee_profiles',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: '$employee' },
        {
          $group: {
            _id: null,
            // For taxes and insurances, calculate from grossSalary * rate (stored as percentage in config)
            // Since rates are percentages, we estimate: approximately 25% for taxes, 10% for insurance of gross
            totalTaxes: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$totalGrossSalary', 0] },
                  0.25,
                ],
              },
            },
            totalInsurance: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$totalGrossSalary', 0] },
                  0.1,
                ],
              },
            },
            totalBenefits: {
              $sum: { $sum: '$earningsDetails.benefits.amount' },
            },
            totalAllowances: {
              $sum: { $sum: '$earningsDetails.allowances.amount' },
            },
            totalBonuses: { $sum: { $sum: '$earningsDetails.bonuses.amount' } },
            employeeCount: { $addToSet: '$employee._id' },
          },
        },
        {
          $project: {
            totalTaxes: 1,
            totalInsurance: 1,
            totalBenefits: 1,
            totalAllowances: 1,
            totalBonuses: 1,
            numberOfEmployees: { $size: '$employeeCount' },
            _id: 0,
          },
        },
      ]);

      return results;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to generate finance report: ${err}`,
      );
    }
  }

  /** PHASE 3: DISPUTES AND CLAIM APPROVAL/REJECTION */

  /** Payroll Specialist: Approve dispute (sends to manager for confirmation) */
  async specialistApproveDispute(
    disputeId: string,
    payrollSpecialistId: string,
    payrollManagerId: string,
    comments?: string,
  ): Promise<disputes> {
    try {
      const dispute = await this.disputesModel.findById(disputeId);
      if (!dispute) throw new NotFoundException('Dispute not found');

      if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
        throw new BadRequestException('Dispute is not under review');
      }

      dispute.status = DisputeStatus.PENDING_MANAGER_APPROVAL;
      dispute.payrollSpecialistId = new Types.ObjectId(payrollSpecialistId);
      dispute.resolutionComment =
        comments ||
        'Approved by payroll specialist, pending manager confirmation';

      await dispute.save();

      // await this.notificationService.createNotification(
      //   payrollManagerId,
      //   `Dispute ${dispute.disputeId} requires your approval`,
      // );

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to approve dispute: ${err.message}`,
      );
    }
  }

  /** Payroll Specialist: Reject dispute (final rejection) */
  async specialistRejectDispute(
    disputeId: string,
    payrollSpecialistId: string,
    rejectionReason: string,
    comments?: string,
  ): Promise<disputes> {
    try {
      const dispute = await this.disputesModel.findById(disputeId);
      if (!dispute) throw new NotFoundException('Dispute not found');

      if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
        throw new BadRequestException('Dispute is not under review');
      }

      dispute.status = DisputeStatus.REJECTED;
      dispute.payrollSpecialistId = new Types.ObjectId(payrollSpecialistId);
      dispute.rejectionReason = rejectionReason;
      dispute.resolutionComment = comments || 'Rejected by payroll specialist';

      await dispute.save();

      // await this.notificationService.createNotification(
      //   dispute.employeeId.toString(),
      //   `Your dispute ${dispute.disputeId} has been rejected. Reason: ${rejectionReason}`,
      // );

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to reject dispute: ${err.message}`,
      );
    }
  }

  /** Payroll Manager: Confirm dispute approval */
async managerConfirmDisputeApproval(
  disputeId: string,
  payrollManagerId: string,
  refundAmount: number,
  comments?: string,
): Promise<disputes> {

  const dispute = await this.disputesModel.findById(disputeId);
  if (!dispute) throw new NotFoundException('Dispute not found');

  if (dispute.status !== DisputeStatus.PENDING_MANAGER_APPROVAL) {
    throw new BadRequestException('Dispute is not pending manager approval');
  }

  if (!refundAmount || refundAmount <= 0) {
    throw new BadRequestException('Refund amount must be greater than zero');
  }

  dispute.status = DisputeStatus.APPROVED;
  dispute.payrollManagerId = new Types.ObjectId(payrollManagerId);
  dispute.resolutionComment = comments
    ? `${dispute.resolutionComment || ''} | Manager confirmed: ${comments}`
    : dispute.resolutionComment;

  await dispute.save();

  // ✅ FIND ALL FINANCE STAFF
  const financeStaffRoles = await this.employeeSystemRoleModel.find({
    roles: SystemRole.FINANCE_STAFF,
    isActive: true,
  }).select('employeeProfileId');

  // ✅ CREATE NOTIFICATION LOGS DIRECTLY
  const notifications = financeStaffRoles.map((role) => ({
    to: role.employeeProfileId.toString(),
    type: 'SYSTEM',
    message: `Refund Requires Processing. Dispute ${dispute.disputeId} has been approved. Refund amount: ${refundAmount}. Please process the refund.`,
  }));

  if (notifications.length > 0) {
    await this.notificationLogModel.insertMany(notifications);
  }

  return dispute;
}

  /** Payroll Manager: Reject dispute */
  async managerRejectDispute(
    disputeId: string,
    payrollManagerId: string,
    rejectionReason: string,
    comments?: string,
  ): Promise<disputes> {
    try {
      const dispute = await this.disputesModel.findById(disputeId);
      if (!dispute) throw new NotFoundException('Dispute not found');

      if (dispute.status !== DisputeStatus.PENDING_MANAGER_APPROVAL) {
        throw new BadRequestException(
          'Dispute is not pending manager approval',
        );
      }

      dispute.status = DisputeStatus.REJECTED;
      dispute.payrollManagerId = new Types.ObjectId(payrollManagerId);
      dispute.rejectionReason = rejectionReason;
      dispute.resolutionComment = comments
        ? `${dispute.resolutionComment || ''} | Manager rejected: ${comments}`
        : `${dispute.resolutionComment || ''} | Rejected by payroll manager`;

      await dispute.save();

      // await this.notificationService.createNotification(
      //   dispute.employeeId.toString(),
      //   `Your dispute ${dispute.disputeId} has been rejected by the payroll manager. Reason: ${rejectionReason}`,
      // );

      // if (dispute.payrollSpecialistId) {
      //   await this.notificationService.createNotification(
      //     dispute.payrollSpecialistId.toString(),
      //     `Dispute ${dispute.disputeId} you approved has been rejected by the manager. Reason: ${rejectionReason}`,
      //   );
      // }

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to reject dispute: ${err.message}`,
      );
    }
  }

  /** Payroll Specialist: Approve claim (sends to manager for confirmation) */
 async specialistApproveClaim(
  claimId: string,
  payrollSpecialistId: string,
  approvedAmount?: number,
  comments?: string,
): Promise<claims> {

  const claim = await this.claimsModel.findById(claimId);
  if (!claim) throw new NotFoundException('Claim not found');

  if (claim.status !== ClaimStatus.UNDER_REVIEW) {
    throw new BadRequestException('Claim is not under review');
  }

  claim.status = ClaimStatus.PENDING_MANAGER_APPROVAL;
  claim.payrollSpecialistId = new Types.ObjectId(payrollSpecialistId);
  claim.approvedAmount = approvedAmount ?? claim.amount;
  claim.resolutionComment =
    comments || 'Approved by payroll specialist, pending manager approval';

  await claim.save();
  return claim;
}
  /** Payroll Specialist: Reject claim (final rejection) */
  async specialistRejectClaim(
    claimId: string,
    payrollSpecialistId: string,
    rejectionReason: string,
    comments?: string,
  ): Promise<claims> {
    try {
      const claim = await this.claimsModel.findById(claimId);
      if (!claim) throw new NotFoundException('Claim not found');

      if (claim.status !== ClaimStatus.UNDER_REVIEW) {
        throw new BadRequestException('Claim is not under review');
      }

      claim.status = ClaimStatus.REJECTED;
      claim.payrollSpecialistId = new Types.ObjectId(payrollSpecialistId);
      claim.rejectionReason = rejectionReason;
      claim.resolutionComment = comments || 'Rejected by payroll specialist';

      await claim.save();

      // await this.notificationService.createNotification(
      //   claim.employeeId.toString(),
      //   `Your claim ${claim.claimId} has been rejected. Reason: ${rejectionReason}`,
      // );

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to reject claim: ${err.message}`,
      );
    }
  }

  /** Payroll Manager: Confirm claim approval */
async managerConfirmClaimApproval(
  claimId: string,
  payrollManagerId: string,
  comments?: string,
): Promise<claims> {

  const claim = await this.claimsModel.findById(claimId);
  if (!claim) throw new NotFoundException('Claim not found');

  if (claim.status !== ClaimStatus.PENDING_MANAGER_APPROVAL) {
    throw new BadRequestException('Claim is not pending manager approval');
  }

  claim.status = ClaimStatus.APPROVED;
  claim.payrollManagerId = new Types.ObjectId(payrollManagerId);
  claim.resolutionComment = comments
    ? `${claim.resolutionComment || ''} | Manager confirmed: ${comments}`
    : claim.resolutionComment;

  await claim.save();

  const refundAmount = claim.approvedAmount ?? claim.amount;

  const financeStaffRoles = await this.employeeSystemRoleModel.find({
    roles: SystemRole.FINANCE_STAFF,
    isActive: true,
  }).select('employeeProfileId');

  const notifications = financeStaffRoles.map((role) => ({
    to: role.employeeProfileId.toString(),
    type: 'SYSTEM',
    message: `Refund Requires Processing. Claim ${claim.claimId} has been approved. Refund amount: ${refundAmount}. Please process the refund.`,
  }));

  if (notifications.length > 0) {
    await this.notificationLogModel.insertMany(notifications);
  }

  return claim;
}

  /** Payroll Manager: Reject claim */
  async managerRejectClaim(
    claimId: string,
    payrollManagerId: string,
    rejectionReason: string,
    comments?: string,
  ): Promise<claims> {
    try {
      const claim = await this.claimsModel.findById(claimId);
      if (!claim) throw new NotFoundException('Claim not found');

      if (claim.status !== ClaimStatus.PENDING_MANAGER_APPROVAL) {
        throw new BadRequestException('Claim is not pending manager approval');
      }

      claim.status = ClaimStatus.REJECTED;
      claim.payrollManagerId = new Types.ObjectId(payrollManagerId);
      claim.rejectionReason = rejectionReason;
      claim.resolutionComment = comments
        ? `${claim.resolutionComment || ''} | Manager rejected: ${comments}`
        : `${claim.resolutionComment || ''} | Rejected by payroll manager`;

      await claim.save();

      // await this.notificationService.createNotification(
      //   claim.employeeId.toString(),
      //   `Your claim ${claim.claimId} has been rejected by the payroll manager. Reason: ${rejectionReason}`,
      // );

      // if (claim.payrollSpecialistId) {
      //   await this.notificationService.createNotification(
      //     claim.payrollSpecialistId.toString(),
      //     `Claim ${claim.claimId} you approved has been rejected by the manager. Reason: ${rejectionReason}`,
      //   );
      // }

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to reject claim: ${err.message}`,
      );
    }
  }

  /** Finance Staff: Create refund for approved dispute or claim */
  async createRefund(
    type: 'dispute' | 'claim',
    recordId: string,
    financeStaffId: string,
    refundAmount: number,
    description?: string,
  ): Promise<refunds> {
    try {
      if (!refundAmount || refundAmount <= 0) {
        throw new BadRequestException(
          'Refund amount must be greater than zero',
        );
      }

      let refundData: any = {
        employeeId: null,
        financeStaffId: new Types.ObjectId(financeStaffId),
        refundDetails: {
          description: description || `Refund`,
          amount: refundAmount,
        } as refundDetails,
        status: RefundStatus.PENDING,
      };

      if (type === 'dispute') {
        const dispute = await this.disputesModel.findById(recordId);
        if (!dispute) throw new NotFoundException('Dispute not found');

        // Prevent duplicate refunds for the same dispute
        const existingForDispute = await this.refundsModel.findOne({ disputeId: dispute._id });
        if (existingForDispute) {
          throw new BadRequestException('A refund already exists for this dispute');
        }

        if (dispute.status !== DisputeStatus.APPROVED) {
          throw new BadRequestException(
            'Only approved disputes can have refunds created',
          );
        }

        refundData.disputeId = dispute._id;
        refundData.employeeId = dispute.employeeId;
        refundData.refundDetails.description =
          description || `Refund for approved dispute ${dispute.disputeId}`;
      } else if (type === 'claim') {
        const claim = await this.claimsModel.findById(recordId);
        if (!claim) throw new NotFoundException('Claim not found');

        // Prevent duplicate refunds for the same claim
        const existingForClaim = await this.refundsModel.findOne({ claimId: claim._id });
        if (existingForClaim) {
          throw new BadRequestException('A refund already exists for this claim');
        }

        if (claim.status !== ClaimStatus.APPROVED) {
          throw new BadRequestException(
            'Only approved claims can have refunds created',
          );
        }

        refundData.claimId = claim._id;
        refundData.employeeId = claim.employeeId;
        refundData.refundDetails.description =
          description ||
          `Refund for approved claim ${claim.claimId} - ${claim.claimType}`;
      } else {
        throw new BadRequestException(
          'Type must be either "dispute" or "claim"',
        );
      }

      const refund = new this.refundsModel(refundData);
      await refund.save();

      // await this.notificationService.createNotification(
      //   refundData.employeeId.toString(),
      //   `A refund of ${refundAmount} has been created and will be processed in the next payroll`,
      // );

      return refund;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create refund: ${err.message}`,
      );
    }
  }

  async getAllRefunds() {
  return this.refundsModel
    .find({
      status: { $in: [RefundStatus.PENDING, RefundStatus.PAID] },
    })
    .populate('employeeId', 'employeeNumber')
    .populate('financeStaffId', 'employeeNumber')
    .populate('claimId', 'claimId')
    .populate('disputeId', 'disputeId')
    .populate('paidInPayrollRunId')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}
  /** Get disputes for payroll specialist review */
  async getDisputesForSpecialistReview(): Promise<disputes[]> {
    return this.disputesModel
      .find({ status: DisputeStatus.UNDER_REVIEW })
      .populate('employeeId')
      .populate('payslipId')
      .exec();
  }

  /** Get claims for payroll specialist review */
  async getClaimsForSpecialistReview(): Promise<claims[]> {
    return this.claimsModel
      .find({ status: ClaimStatus.UNDER_REVIEW })
      .populate('employeeId')
      .exec();
  }

  /** Get disputes pending manager approval */
  async getDisputesForManagerApproval(): Promise<disputes[]> {
    return this.disputesModel
      .find({ status: DisputeStatus.PENDING_MANAGER_APPROVAL })
      .populate('employeeId')
      .populate('payrollSpecialistId')
      .populate('payslipId')
      .exec();
  }

  /** Get claims pending manager approval */
  async getClaimsForManagerApproval(): Promise<claims[]> {
    return this.claimsModel
      .find({ status: ClaimStatus.PENDING_MANAGER_APPROVAL })
      .populate('employeeId')
      .populate('payrollSpecialistId')
      .exec();
  }

  /** Get approved records for finance staff visibility */
  async getApprovedRecordsForFinance(): Promise<{
    disputes: disputes[];
    claims: claims[];
  }> {
    const disputes = await this.disputesModel
      .find({ status: DisputeStatus.APPROVED })
      .populate('employeeId')
      .populate('payrollSpecialistId')
      .populate('payrollManagerId')
      .exec();

    const claims = await this.claimsModel
      .find({ status: ClaimStatus.APPROVED })
      .populate('employeeId')
      .populate('payrollSpecialistId')
      .populate('payrollManagerId')
      .exec();

    return { disputes, claims };
  }

  /** PHASE 4: REFUND PROCESS */

  /** Finance Staff: Get all refunds (pending and paid) */
async getPendingRefunds() {
  return this.refundsModel
    .find({ status: RefundStatus.PENDING })
    .populate('employeeId', 'employeeNumber')
    .populate('financeStaffId', 'employeeNumber')
    .populate('claimId', 'claimId')
    .populate('disputeId', 'disputeId')
    .lean()
    .exec();
}
  /** Finance Staff: Mark refund as paid (when processed in payroll) */
  async markRefundAsPaid(
    refundId: string,
    payrollRunId: string,
  ): Promise<refunds> {
    try {
      const refund = await this.refundsModel.findById(refundId);
      if (!refund) throw new NotFoundException('Refund not found');

      if (refund.status !== RefundStatus.PENDING) {
        throw new BadRequestException('Refund is not pending');
      }

      // Validate payroll run exists
      const payrollRun = await this.payrollRunModel.findById(payrollRunId);
      if (!payrollRun) {
        throw new NotFoundException('Payroll run not found');
      }

      // Check if payroll period is not expired (in the past)
      const now = new Date();
      if (new Date(payrollRun.payrollPeriod) < now) {
        throw new BadRequestException(
          'Cannot mark refund as paid for an expired payroll period'
        );
      }

      refund.status = RefundStatus.PAID;
      refund.paidInPayrollRunId = new Types.ObjectId(payrollRunId);

      await refund.save();

      // await this.notificationService.createNotification(
      //   refund.employeeId.toString(),
      //   `Your refund of ${refund.refundDetails.amount} has been processed and will be included in the next payroll`,
      // );

      return refund;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to mark refund as paid: ${err.message}`,
      );
    }
  }

  /** Get refunds by payroll run */
  async getRefundsByPayrollRun(payrollRunId: string): Promise<refunds[]> {
    return this.refundsModel
      .find({ paidInPayrollRunId: payrollRunId })
      .populate('employeeId')
      .populate('claimId')
      .populate('disputeId')
      .exec();
  }

  /** Get all refunds for an employee */
  async getEmployeeRefunds(employeeId: string): Promise<refunds[]> {
    return this.refundsModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('claimId')
      .populate('disputeId')
      .populate('paidInPayrollRunId')
      .exec();
  }

  /** Get all disputes for an employee */
  async getEmployeeDisputes(employeeId: string): Promise<disputes[]> {
    return this.disputesModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Get all claims for an employee */
  async getEmployeeClaims(employeeId: string): Promise<claims[]> {
    return this.claimsModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
