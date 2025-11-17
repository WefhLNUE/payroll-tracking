import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payslip, PayslipDocument } from './models/PaySlip.schema';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(Payslip.name) private payslipModel: Model<PayslipDocument>,
  ) {}

  async create(createPayslipDto: CreatePayslipDto): Promise<PayslipDocument> {
    try {
      const payslip = new this.payslipModel({
        ...createPayslipDto,
        employeeId: new Types.ObjectId(createPayslipDto.employeeId),
        payrollRunId: new Types.ObjectId(createPayslipDto.payrollRunId),
        periodStart: new Date(createPayslipDto.periodStart),
        periodEnd: new Date(createPayslipDto.periodEnd),
        processedAt: new Date(createPayslipDto.processedAt),
        effectiveDate: new Date(createPayslipDto.effectiveDate),
      });
      return await payslip.save();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create payslip: ${errorMessage}`,
      );
    }
  }

  async findAll(): Promise<PayslipDocument[]> {
    return await this.payslipModel.find().exec();
  }

  async findOne(id: string): Promise<PayslipDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payslip ID');
    }

    const payslip = await this.payslipModel.findById(id).exec();
    if (!payslip) {
      throw new NotFoundException(`Payslip with ID ${id} not found`);
    }
    return payslip;
  }

  async findByEmployeeId(employeeId: string): Promise<PayslipDocument[]> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return await this.payslipModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .exec();
  }

  async findByPayrollRunId(payrollRunId: string): Promise<PayslipDocument[]> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run ID');
    }

    return await this.payslipModel
      .find({ payrollRunId: new Types.ObjectId(payrollRunId) })
      .exec();
  }

  async update(
    id: string,
    updatePayslipDto: UpdatePayslipDto,
  ): Promise<PayslipDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payslip ID');
    }

    const updateData: Record<string, unknown> = { ...updatePayslipDto };

    // Convert string dates to Date objects if present
    if (updatePayslipDto.periodStart) {
      updateData.periodStart = new Date(updatePayslipDto.periodStart);
    }
    if (updatePayslipDto.periodEnd) {
      updateData.periodEnd = new Date(updatePayslipDto.periodEnd);
    }
    if (updatePayslipDto.processedAt) {
      updateData.processedAt = new Date(updatePayslipDto.processedAt);
    }
    if (updatePayslipDto.effectiveDate) {
      updateData.effectiveDate = new Date(updatePayslipDto.effectiveDate);
    }

    // Convert ObjectId strings to ObjectId if present
    if (updatePayslipDto.employeeId) {
      updateData.employeeId = new Types.ObjectId(updatePayslipDto.employeeId);
    }
    if (updatePayslipDto.payrollRunId) {
      updateData.payrollRunId = new Types.ObjectId(
        updatePayslipDto.payrollRunId,
      );
    }

    const payslip = await this.payslipModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!payslip) {
      throw new NotFoundException(`Payslip with ID ${id} not found`);
    }

    return payslip;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payslip ID');
    }

    const result = await this.payslipModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Payslip with ID ${id} not found`);
    }
  }
}
