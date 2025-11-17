import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseClaim } from './models/ExpenseClaim.schema';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from './dto/update-expense-claim.dto';

@Injectable()
export class ExpenseClaimService {
  constructor(
    @InjectModel(ExpenseClaim.name)
    private expenseClaimModel: Model<ExpenseClaim>,
  ) {}

  async create(createDto: CreateExpenseClaimDto): Promise<ExpenseClaim> {
    try {
      const expenseClaim = new this.expenseClaimModel({
        ...createDto,
        employeeId: new Types.ObjectId(createDto.employeeId),
        approvedAt: createDto.approvedAt
          ? new Date(createDto.approvedAt)
          : undefined,
      });
      return await expenseClaim.save();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create expense claim: ${errorMessage}`,
      );
    }
  }

  async findAll(): Promise<ExpenseClaim[]> {
    return await this.expenseClaimModel.find().exec();
  }

  async findOne(id: string): Promise<ExpenseClaim> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid expense claim ID');
    }

    const expenseClaim = await this.expenseClaimModel.findById(id).exec();
    if (!expenseClaim) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }
    return expenseClaim;
  }

  async findByEmployeeId(employeeId: string): Promise<ExpenseClaim[]> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return await this.expenseClaimModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .exec();
  }

  async findByStatus(status: string): Promise<ExpenseClaim[]> {
    return await this.expenseClaimModel.find({ status }).exec();
  }

  async update(
    id: string,
    updateDto: UpdateExpenseClaimDto,
  ): Promise<ExpenseClaim> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid expense claim ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };

    if (updateDto.employeeId) {
      updateData.employeeId = new Types.ObjectId(updateDto.employeeId);
    }

    if (updateDto.approvedAt) {
      updateData.approvedAt = new Date(updateDto.approvedAt);
    }

    const expenseClaim = await this.expenseClaimModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!expenseClaim) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }

    return expenseClaim;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid expense claim ID');
    }

    const result = await this.expenseClaimModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }
  }
}
