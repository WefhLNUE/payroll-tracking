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
  ): Promise<disputes> {
    try {
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
      if (comments) {
        dispute.resolutionComment += ` | Manager confirmed: ${comments}`;
      }

      await dispute.save();

      await this.notificationService.createNotification(
        financeStaffId,
        `Dispute ${dispute.disputeId} has been approved. Please create a refund of ${refundAmount}`
      );

      await this.notificationService.createNotification(
        dispute.employeeId.toString(),
        `Your dispute ${dispute.disputeId} has been approved. Finance staff will process your refund of ${refundAmount}`
      );

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to confirm dispute approval: ${err.message}`);
    }
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
        throw new BadRequestException('Dispute is not pending manager approval');
      }

      dispute.status = DisputeStatus.REJECTED;
      dispute.payrollManagerId = new Types.ObjectId(payrollManagerId);
      dispute.rejectionReason = rejectionReason;
      dispute.resolutionComment = comments 
        ? `${dispute.resolutionComment || ''} | Manager rejected: ${comments}`
        : `${dispute.resolutionComment || ''} | Rejected by payroll manager`;
      
      await dispute.save();

      await this.notificationService.createNotification(
        dispute.employeeId.toString(),
        `Your dispute ${dispute.disputeId} has been rejected by the payroll manager. Reason: ${rejectionReason}`
      );

      if (dispute.payrollSpecialistId) {
        await this.notificationService.createNotification(
          dispute.payrollSpecialistId.toString(),
          `Dispute ${dispute.disputeId} you approved has been rejected by the manager. Reason: ${rejectionReason}`
        );
      }

      return dispute;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to reject dispute: ${err.message}`);
    }
  }

  /** Payroll Specialist: Approve claim (sends to manager for confirmation) */
  async specialistApproveClaim(
    claimId: string,
    payrollSpecialistId: string,
    payrollManagerId: string,
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

      await this.notificationService.createNotification(
        payrollManagerId,
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
  ): Promise<claims> {
    try {
      const claim = await this.claimsModel.findById(claimId);
      if (!claim) throw new NotFoundException('Claim not found');

      if (claim.status !== ClaimStatus.PENDING_MANAGER_APPROVAL) {
        throw new BadRequestException('Claim is not pending manager approval');
      }

      claim.status = ClaimStatus.APPROVED;
      claim.payrollManagerId = new Types.ObjectId(payrollManagerId);
      claim.resolutionComment += ` | Manager confirmed: ${comments}`;
      

      await claim.save();

      await this.notificationService.createNotification(
        payrollManagerId,
        `Claim ${claim.claimId} has been approved. Please create a refund of ${claim.approvedAmount || claim.amount}`
      );

      await this.notificationService.createNotification(
        claim.employeeId.toString(),
        `Your claim ${claim.claimId} has been approved. Finance staff will process your refund of ${claim.approvedAmount || claim.amount}`
      );

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to confirm claim approval: ${err.message}`);
    }
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

      await this.notificationService.createNotification(
        claim.employeeId.toString(),
        `Your claim ${claim.claimId} has been rejected by the payroll manager. Reason: ${rejectionReason}`
      );

      if (claim.payrollSpecialistId) {
        await this.notificationService.createNotification(
          claim.payrollSpecialistId.toString(),
          `Claim ${claim.claimId} you approved has been rejected by the manager. Reason: ${rejectionReason}`
        );
      }

      return claim;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to reject claim: ${err.message}`);
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
        throw new BadRequestException('Refund amount must be greater than zero');
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
        
        if (dispute.status !== DisputeStatus.APPROVED) {
          throw new BadRequestException('Only approved disputes can have refunds created');
        }

        refundData.disputeId = dispute._id;
        refundData.employeeId = dispute.employeeId;
        refundData.refundDetails.description = description || `Refund for approved dispute ${dispute.disputeId}`;

      } else if (type === 'claim') {
        const claim = await this.claimsModel.findById(recordId);
        if (!claim) throw new NotFoundException('Claim not found');
        
        if (claim.status !== ClaimStatus.APPROVED) {
          throw new BadRequestException('Only approved claims can have refunds created');
        }

        refundData.claimId = claim._id;
        refundData.employeeId = claim.employeeId;
        refundData.refundDetails.description = description || `Refund for approved claim ${claim.claimId} - ${claim.claimType}`;

      } else {
        throw new BadRequestException('Type must be either "dispute" or "claim"');
      }

      const refund = new this.refundsModel(refundData);
      await refund.save();

      await this.notificationService.createNotification(
        refundData.employeeId.toString(),
        `A refund of ${refundAmount} has been created and will be processed in the next payroll`
      );

      return refund;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to create refund: ${err.message}`);
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