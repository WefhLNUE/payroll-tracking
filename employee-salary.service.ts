import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeSalary } from './models/EmployeeSalary.schmea';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';

@Injectable()
export class EmployeeSalaryService {
  constructor(
    @InjectModel(EmployeeSalary.name)
    private employeeSalaryModel: Model<EmployeeSalary>,
  ) {}

  async create(createDto: CreateEmployeeSalaryDto): Promise<EmployeeSalary> {
    try {
      const salary = new this.employeeSalaryModel({
        ...createDto,
        employeeId: new Types.ObjectId(createDto.employeeId),
        ContractType: new Types.ObjectId(createDto.ContractType),
      });
      return await salary.save();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create employee salary: ${errorMessage}`,
      );
    }
  }

  async findAll(): Promise<EmployeeSalary[]> {
    return await this.employeeSalaryModel.find().exec();
  }

  async findOne(id: string): Promise<EmployeeSalary> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid employee salary ID');
    }

    const salary = await this.employeeSalaryModel.findById(id).exec();
    if (!salary) {
      throw new NotFoundException(`Employee salary with ID ${id} not found`);
    }
    return salary;
  }

  async findByEmployeeId(employeeId: string): Promise<EmployeeSalary[]> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return await this.employeeSalaryModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .exec();
  }

  async update(
    id: string,
    updateDto: UpdateEmployeeSalaryDto,
  ): Promise<EmployeeSalary> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid employee salary ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };

    if (updateDto.employeeId) {
      updateData.employeeId = new Types.ObjectId(updateDto.employeeId);
    }

    if (updateDto.ContractType) {
      updateData.ContractType = new Types.ObjectId(updateDto.ContractType);
    }

    const salary = await this.employeeSalaryModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!salary) {
      throw new NotFoundException(`Employee salary with ID ${id} not found`);
    }

    return salary;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid employee salary ID');
    }

    const result = await this.employeeSalaryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Employee salary with ID ${id} not found`);
    }
  }
}

