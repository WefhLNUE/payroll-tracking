import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dispute } from './models/Dispute.schema';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(Dispute.name) private disputeModel: Model<Dispute>,
  ) {}

  async create(createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    try {
      const dispute = new this.disputeModel({
        ...createDisputeDto,
        employeeId: new Types.ObjectId(createDisputeDto.employeeId),
        resolvedAt: createDisputeDto.resolvedAt
          ? new Date(createDisputeDto.resolvedAt)
          : undefined,
      });
      return await dispute.save();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create dispute: ${errorMessage}`,
      );
    }
  }

  async findAll(): Promise<Dispute[]> {
    return await this.disputeModel.find().exec();
  }

  async findOne(id: string): Promise<Dispute> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const dispute = await this.disputeModel.findById(id).exec();
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${id} not found`);
    }
    return dispute;
  }

  async findByEmployeeId(employeeId: string): Promise<Dispute[]> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return await this.disputeModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .exec();
  }

  async findByStatus(status: string): Promise<Dispute[]> {
    return await this.disputeModel.find({ status }).exec();
  }

  async update(
    id: string,
    updateDisputeDto: UpdateDisputeDto,
  ): Promise<Dispute> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const updateData: Record<string, unknown> = { ...updateDisputeDto };

    if (updateDisputeDto.employeeId) {
      updateData.employeeId = new Types.ObjectId(updateDisputeDto.employeeId);
    }

    if (updateDisputeDto.resolvedAt) {
      updateData.resolvedAt = new Date(updateDisputeDto.resolvedAt);
    }

    const dispute = await this.disputeModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${id} not found`);
    }

    return dispute;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid dispute ID');
    }

    const result = await this.disputeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Dispute with ID ${id} not found`);
    }
  }
}

