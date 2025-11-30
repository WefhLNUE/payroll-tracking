import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  paySlip,
  PayslipDocument,
} from '../payroll-execution/Models/payslip.schema';
import {
  payrollRuns,
  payrollRunsDocument,
} from 'src/payroll-execution/Models/payrollRuns.schema';
import {
  disputes,
  disputesDocument,
} from '../payroll-tracking/Models/disputes.schema';
import {
  claims,
  claimsDocument,
} from '../payroll-tracking/Models/claims.schema';
import {
  refunds,
  refundsDocument,
  refundDetails,
} from '../payroll-tracking/Models/refunds.schema';
import { Model, Types } from 'mongoose';
import {
  DisputeStatus,
  ClaimStatus,
  RefundStatus,
} from './enums/payroll-tracking-enum';

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
  ) {}

  /** Find payslips for a department (optional) */
  async findPaySlipsByDepartment(departmentId: string, payrollRunID: string) {
    try {
      const results: PayslipDocument[] = await this.payslipModel
        .find({ payrollRunId: payrollRunID })
        .populate({
          path: 'employeeId',
          match: { primaryDepartmentId: departmentId },
        });

      // Filter out non-matching (employees not in this department)
      return results.filter((p) => p.employeeId);
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to fetch payslips: ${err}`,
      );
    }
  }

  /** Find payroll runs by month */
  async findPayrollRunByMonth(month: string, year: string) {
    try {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      return await this.payrollRunModel.find({
        payrollPeriod: { $gte: startDate, $lte: endDate },
      });
    } catch (err) {
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
            totalTaxes: { $sum: { $sum: '$deductionsDetails.taxes.amount' } },
            totalInsurance: {
              $sum: { $sum: '$deductionsDetails.insurances.amount' },
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

  /** Approve a dispute and create refund */
  async approveDispute(
    disputeId: string,
    financeStaffId: string,
    refundAmount: number,
  ): Promise<disputes> {
    try {
      const dispute = await this.disputesModel.findById(disputeId);
      if (!dispute) throw new NotFoundException('Dispute not found');

      if (dispute.status !== DisputeStatus.APPROVED)
        throw new BadRequestException('Dispute is not under review');

      const payslip = await this.payslipModel.findById(dispute.payslipId);
      if (!payslip) throw new NotFoundException('Original payslip not found');

      // Create refund record
      const refund = new this.refundsModel({
        disputeId: dispute._id,
        employeeId: dispute.employeeId,
        financeStaffId: new Types.ObjectId(financeStaffId),
        refundDetails: {
          description: `Refund for dispute ${dispute.disputeId}`,
          amount: refundAmount,
        } as refundDetails,
        status: RefundStatus.PENDING,
      });

      await refund.save();

      dispute.financeStaffId = new Types.ObjectId(financeStaffId);
      dispute.resolutionComment = `Refund approved: ${refundAmount}`;
      await dispute.save();

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to approve dispute: ${err}`,
      );
    }
  }

  /** Approve a claim and create refund */
  async approveClaim(claimId: string, financeStaffId: string): Promise<claims> {
    try {
      const claim = await this.claimsModel.findById(claimId);
      if (!claim) throw new NotFoundException('Claim not found');

      if (claim.status !== ClaimStatus.APPROVED)
        throw new BadRequestException('Claim is not under review');

      claim.approvedAmount = claim.amount;
      claim.financeStaffId = new Types.ObjectId(financeStaffId);
      claim.resolutionComment = `Approved for payroll execution: ${claim.amount}`;
      await claim.save();

      // Create refund record
      const refund = new this.refundsModel({
        claimId: claim._id,
        employeeId: claim.employeeId,
        financeStaffId: new Types.ObjectId(financeStaffId),
        refundDetails: {
          description: `Claim approved: ${claim.claimId}`,
          amount: claim.approvedAmount,
        } as refundDetails,
        status: RefundStatus.PENDING,
      });

      await refund.save();

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to approve claim: ${err}`);
    }
  }
}
