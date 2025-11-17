import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeCompensation } from './models/EmployeeCompensation.schema';
import { CreateEmployeeCompensationDto } from './dto/create-employee-compensation.dto';
import { UpdateEmployeeCompensationDto } from './dto/update-employee-compensation.dto';

@Injectable()
export class EmployeeCompensationService {
  constructor(
    @InjectModel(EmployeeCompensation.name)
    private compensationModel: Model<EmployeeCompensation>,
  ) {}

  async create(
    createDto: CreateEmployeeCompensationDto,
  ): Promise<EmployeeCompensation> {
    try {
      const compensation = new this.compensationModel({
        ...createDto,
        employeeId: new Types.ObjectId(createDto.employeeId),
      });
      return await compensation.save();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create employee compensation: ${errorMessage}`,
      );
    }
  }

  async findAll(): Promise<EmployeeCompensation[]> {
    return await this.compensationModel.find().exec();
  }

  async findOne(id: string): Promise<EmployeeCompensation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid compensation ID');
    }

    const compensation = await this.compensationModel.findById(id).exec();
    if (!compensation) {
      throw new NotFoundException(
        `Employee compensation with ID ${id} not found`,
      );
    }
    return compensation;
  }

  async findByEmployeeId(employeeId: string): Promise<EmployeeCompensation[]> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return await this.compensationModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .exec();
  }

  async findByStatus(status: string): Promise<EmployeeCompensation[]> {
    return await this.compensationModel.find({ status }).exec();
  }

  async update(
    id: string,
    updateDto: UpdateEmployeeCompensationDto,
  ): Promise<EmployeeCompensation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid compensation ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };

    if (updateDto.employeeId) {
      updateData.employeeId = new Types.ObjectId(updateDto.employeeId);
    }

    const compensation = await this.compensationModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!compensation) {
      throw new NotFoundException(
        `Employee compensation with ID ${id} not found`,
      );
    }

    return compensation;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid compensation ID');
    }

    const result = await this.compensationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(
        `Employee compensation with ID ${id} not found`,
      );
    }
  }
}

