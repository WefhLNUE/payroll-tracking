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
} from 'src/payroll-execution/Models/payslip.schema';
import {
  payrollRuns,
  payrollRunsDocument,
} from 'src/payroll-execution/Models/payrollRuns.schema';
import {
  disputes,
  disputesDocument,
} from './Models/disputes.schema';
import {
  claims,
  claimsDocument,
} from './Models/claims.schema';
import {
  refunds,
  refundsDocument,
  refundDetails,
} from './Models/refunds.schema';
import { Model, Types } from 'mongoose';
import {
  DisputeStatus,
  ClaimStatus,
  RefundStatus,
} from './enums/payroll-tracking-enum';
import { NotificationService } from 'src/time-management/services/notification.service';

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
    private readonly notificationService: NotificationService,
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
      dispute.resolutionComment = comments || 'Approved by payroll specialist, pending manager confirmation';
      
      await dispute.save();

      // Notify payroll manager
      await this.notificationService.createNotification(
        payrollManagerId,
        `Dispute ${dispute.disputeId} requires your approval`
      );

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to approve dispute: ${err.message}`);
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

      // Notify employee about rejection
      await this.notificationService.createNotification(
        dispute.employeeId.toString(),
        `Your dispute ${dispute.disputeId} has been rejected. Reason: ${rejectionReason}`
      );

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to reject dispute: ${err.message}`);
    }
  }

  /** Payroll Manager: Confirm dispute approval */
async managerConfirmDisputeApproval(
  disputeId: string,
  payrollManagerId: string,
  financeStaffId: string,
  refundAmount: number,
  comments?: string,
): Promise<{ dispute: disputes; refund: refunds }> {
  try {
    const dispute = await this.disputesModel.findById(disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dispute.status !== DisputeStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Dispute is not pending manager approval');
    }

    // Validate refund amount 
    if (!refundAmount || refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    // Manager confirms approval
    dispute.status = DisputeStatus.APPROVED;
    dispute.payrollManagerId = new Types.ObjectId(payrollManagerId);
    if (comments) {
      dispute.resolutionComment += ` | Manager confirmed: ${comments}`;
    }

    await dispute.save();

    // Create refund record for approved dispute 
    const refund = new this.refundsModel({
      disputeId: dispute._id,
      employeeId: dispute.employeeId,
      financeStaffId: new Types.ObjectId(financeStaffId),
      refundDetails: {
        description: `Refund for approved dispute ${dispute.disputeId}`,
        amount: refundAmount,
      } as refundDetails,
      status: RefundStatus.PENDING,
    });

    await refund.save();

    // Notify finance staff
    await this.notifyFinanceStaff(dispute, refund);

    // Notify employee about approval
    await this.notificationService.createNotification(
      dispute.employeeId.toString(),
      `Your dispute ${dispute.disputeId} has been approved and is being processed for refund of ${refundAmount}`
    );

    return { dispute, refund };
  } catch (err) {
    throw new InternalServerErrorException(`Failed to confirm dispute approval: ${err.message}`);
  }
}

  /** Payroll Specialist: Approve claim (sends to manager for confirmation) */
  async specialistApproveClaim(
    claimId: string,
    payrollSpecialistId: string,
    approvedAmount?: number,
    comments?: string,
  ): Promise<claims> {
    try {
      const claim = await this.claimsModel.findById(claimId);
      if (!claim) throw new NotFoundException('Claim not found');

      if (claim.status !== ClaimStatus.UNDER_REVIEW) {
        throw new BadRequestException('Claim is not under review');
      }

      claim.status = ClaimStatus.PENDING_MANAGER_APPROVAL;
      claim.payrollSpecialistId = new Types.ObjectId(payrollSpecialistId);
      claim.approvedAmount = approvedAmount || claim.amount;
      claim.resolutionComment = comments || 'Approved by payroll specialist, pending manager confirmation';
      
      await claim.save();

      // Notify payroll manager
      await this.notificationService.createNotification(
        payrollSpecialistId, // In real scenario, get manager ID from org structure
        `Claim ${claim.claimId} requires your approval`
      );

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to approve claim: ${err.message}`);
    }
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

      // Notify employee about rejection
      await this.notificationService.createNotification(
        claim.employeeId.toString(),
        `Your claim ${claim.claimId} has been rejected. Reason: ${rejectionReason}`
      );

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to reject claim: ${err.message}`);
    }
  }

  /** Payroll Manager: Confirm claim approval */
  async managerConfirmClaimApproval(
    claimId: string,
    payrollManagerId: string,
    comments?: string,
  ): Promise<{ claim: claims; refund: refunds }> {
    try {
      const claim = await this.claimsModel.findById(claimId);
      if (!claim) throw new NotFoundException('Claim not found');

      if (claim.status !== ClaimStatus.PENDING_MANAGER_APPROVAL) {
        throw new BadRequestException('Claim is not pending manager approval');
      }

      claim.status = ClaimStatus.APPROVED;
      claim.payrollManagerId = new Types.ObjectId(payrollManagerId);
      if (comments) {
        claim.resolutionComment += ` | Manager confirmed: ${comments}`;
      }

      await claim.save();

      // Create refund record for approved claim
      const refund = new this.refundsModel({
        claimId: claim._id,
        employeeId: claim.employeeId,
        financeStaffId: new Types.ObjectId(payrollManagerId),
        refundDetails: {
          description: `Refund for approved claim ${claim.claimId} - ${claim.claimType}`,
          amount: claim.approvedAmount,
        } as refundDetails,
        status: RefundStatus.PENDING,
      });

      await refund.save();

      // Notify finance staff
      await this.notifyFinanceStaffForClaim(claim, refund);

      // Notify employee about approval
      await this.notificationService.createNotification(
        claim.employeeId.toString(),
        `Your claim ${claim.claimId} has been approved and will be processed for refund of ${claim.approvedAmount}`
      );

      return { claim, refund };
    } catch (err) {
      throw new InternalServerErrorException(`Failed to confirm claim approval: ${err.message}`);
    }
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
  async getApprovedRecordsForFinance(): Promise<{ disputes: disputes[]; claims: claims[] }> {
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

  /** Finance Staff: Get all pending refunds */
  async getPendingRefunds(): Promise<refunds[]> {
    return this.refundsModel
      .find({ status: RefundStatus.PENDING })
      .populate('employeeId')
      .populate('financeStaffId')
      .populate('claimId')
      .populate('disputeId')
      .exec();
  }

  /** Finance Staff: Mark refund as paid (when processed in payroll) */
  async markRefundAsPaid(
    refundId: string, 
    payrollRunId: string
  ): Promise<refunds> {
    try {
      const refund = await this.refundsModel.findById(refundId);
      if (!refund) throw new NotFoundException('Refund not found');

      if (refund.status !== RefundStatus.PENDING) {
        throw new BadRequestException('Refund is not pending');
      }

      refund.status = RefundStatus.PAID;
      refund.paidInPayrollRunId = new Types.ObjectId(payrollRunId);
      
      await refund.save();

      // Notify employee that refund has been processed
      await this.notificationService.createNotification(
        refund.employeeId.toString(),
        `Your refund of ${refund.refundDetails.amount} has been processed and will be included in the next payroll`
      );

      return refund;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to mark refund as paid: ${err.message}`);
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
    .sort({ createdAt: -1 }) // Optional: sort by newest first
    .exec();
}

/** Get all claims for an employee */
async getEmployeeClaims(employeeId: string): Promise<claims[]> {
  return this.claimsModel
    .find({ employeeId: new Types.ObjectId(employeeId) })
    .sort({ createdAt: -1 }) // Optional: sort by newest first
    .exec();
}

  /** Private notification methods using existing NotificationService */
  private async notifyFinanceStaff(dispute: disputes, refund: refunds): Promise<void> {
    const message = `Dispute ${dispute.disputeId} has been approved and requires refund processing. Amount: ${refund.refundDetails.amount}`;
    
    // Send notification to finance staff
    await this.notificationService.createNotification(
      refund.financeStaffId.toString(),
      message
    );
  }

  private async notifyFinanceStaffForClaim(claim: claims, refund: refunds): Promise<void> {
    const message = `Claim ${claim.claimId} (${claim.claimType}) has been approved and requires refund processing. Amount: ${refund.refundDetails.amount}`;
    
    // Send notification to finance staff
    await this.notificationService.createNotification(
      refund.financeStaffId.toString(),
      message
    );
  }
}