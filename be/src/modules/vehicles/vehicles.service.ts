import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleDriverAssignment } from './entities/vehicle-driver-assignment.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus, VehicleType } from 'src/enums/vehicle-type.enum';
import { UserRole } from 'src/enums/user.enums';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(VehicleDriverAssignment)
    private readonly assignmentRepository: Repository<VehicleDriverAssignment>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private getSeatCount(vehicleType: VehicleType) {
    switch (vehicleType) {
      case VehicleType.FIVE_SEAT:
        return 5;

      case VehicleType.SEVEN_SEAT:
        return 7;

      case VehicleType.LIMOUSINE_10:
        return 10;

      default:
        throw new BadRequestException('Loại xe không hợp lệ');
    }
  }

  private assertAdminHasCompany(currentUser: CurrentUserData) {
    if (currentUser.role === UserRole.ADMIN && !currentUser.companyId) {
      throw new ForbiddenException('Tài khoản admin chưa được gán nhà xe');
    }
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new BadRequestException('Nhà xe không tồn tại');
    }

    return company;
  }

  private async resolveCompanyIdForCreate(
    dtoCompanyId: string | undefined,
    currentUser: CurrentUserData,
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);
      return currentUser.companyId as string;
    }

    if (!dtoCompanyId) {
      throw new BadRequestException('Vui lòng chọn nhà xe cho xe');
    }

    await this.ensureCompanyExists(dtoCompanyId);

    return dtoCompanyId;
  }

  private assertCanAccessVehicle(
    currentUser: CurrentUserData,
    vehicle: Vehicle,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      return;
    }

    this.assertAdminHasCompany(currentUser);

    if (vehicle.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập xe của nhà xe khác',
      );
    }
  }

  async create(dto: CreateVehicleDto, currentUser: CurrentUserData) {
    const licensePlate = dto.licensePlate.trim().toUpperCase();

    const existed = await this.vehicleRepository.findOne({
      where: {
        licensePlate,
      },
    });

    if (existed) {
      throw new ConflictException('Biển số xe đã tồn tại');
    }

    const companyId = await this.resolveCompanyIdForCreate(
      dto.companyId,
      currentUser,
    );

    const vehicle = this.vehicleRepository.create({
      companyId,
      licensePlate,
      vehicleType: dto.vehicleType,
      seatCount: this.getSeatCount(dto.vehicleType),
      brand: dto.brand || null,
      model: dto.model || null,
      color: dto.color || null,
      productionYear: dto.productionYear || null,
      registrationExpiryDate: dto.registrationExpiryDate || null,
      status: dto.status || VehicleStatus.ACTIVE,
      note: dto.note || null,
    });

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    return this.findOne(savedVehicle.id, currentUser);
  }

  async findAll(query: ListVehiclesQueryDto, currentUser: CurrentUserData) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      licensePlate: 'vehicle.license_plate',
      vehicleType: 'vehicle.vehicle_type',
      seatCount: 'vehicle.seat_count',
      brand: 'vehicle.brand',
      model: 'vehicle.model',
      status: 'vehicle.status',
      createdAt: 'vehicle.created_at',
      updatedAt: 'vehicle.updated_at',
    };

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.company', 'company');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          vehicle.license_plate ILIKE :keyword
          OR vehicle.brand ILIKE :keyword
          OR vehicle.model ILIKE :keyword
          OR company.name ILIKE :keyword
          OR company.code ILIKE :keyword
        )
        `,
        {
          keyword,
        },
      );
    }

    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);

      qb.andWhere('vehicle.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    } else if (query.companyId) {
      qb.andWhere('vehicle.company_id = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.vehicleType) {
      qb.andWhere('vehicle.vehicle_type = :vehicleType', {
        vehicleType: query.vehicleType,
      });
    }

    if (query.status) {
      qb.andWhere('vehicle.status = :status', {
        status: query.status,
      });
    }

    qb.orderBy(
      sortColumnMap[sortBy] || 'vehicle.created_at',
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .skip(skip)
      .take(limit);

    const [vehicles, total] = await qb.getManyAndCount();

    let items: Array<Vehicle & { assignmentOnDate?: VehicleDriverAssignment | null }> =
      vehicles;

    if (query.assignmentDate && vehicles.length > 0) {
      const vehicleIds = vehicles.map((vehicle) => vehicle.id);

      const assignments = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.driver', 'driver')
        .where('assignment.vehicle_id IN (:...vehicleIds)', {
          vehicleIds,
        })
        .andWhere('assignment.date = :date', {
          date: query.assignmentDate,
        })
        .getMany();

      const assignmentMap = new Map(
        assignments.map((assignment) => [assignment.vehicleId, assignment]),
      );

      items = vehicles.map((vehicle) => ({
        ...vehicle,
        assignmentOnDate: assignmentMap.get(vehicle.id) || null,
      }));
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: CurrentUserData) {
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        id,
      },
      relations: {
        company: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe');
    }

    this.assertCanAccessVehicle(currentUser, vehicle);

    return vehicle;
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
    currentUser: CurrentUserData,
  ) {
    const vehicle = await this.findOne(id, currentUser);

    if (
      dto.licensePlate &&
      dto.licensePlate.trim().toUpperCase() !== vehicle.licensePlate
    ) {
      const licensePlate = dto.licensePlate.trim().toUpperCase();

      const existed = await this.vehicleRepository.findOne({
        where: {
          licensePlate,
        },
      });

      if (existed) {
        throw new ConflictException('Biển số xe đã tồn tại');
      }

      vehicle.licensePlate = licensePlate;
    }

    if (currentUser.role !== UserRole.ADMIN && dto.companyId !== undefined) {
      if (!dto.companyId) {
        throw new BadRequestException('Vui lòng chọn nhà xe cho xe');
      }

      await this.ensureCompanyExists(dto.companyId);

      vehicle.companyId = dto.companyId;
    }

    if (dto.vehicleType !== undefined) {
      vehicle.vehicleType = dto.vehicleType;
      vehicle.seatCount = this.getSeatCount(dto.vehicleType);
    }

    if (dto.brand !== undefined) vehicle.brand = dto.brand || null;
    if (dto.model !== undefined) vehicle.model = dto.model || null;
    if (dto.color !== undefined) vehicle.color = dto.color || null;
    if (dto.productionYear !== undefined) {
      vehicle.productionYear = dto.productionYear || null;
    }
    if (dto.registrationExpiryDate !== undefined) {
      vehicle.registrationExpiryDate = dto.registrationExpiryDate || null;
    }
    if (dto.status !== undefined) vehicle.status = dto.status;
    if (dto.note !== undefined) vehicle.note = dto.note || null;

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    return this.findOne(savedVehicle.id, currentUser);
  }

  async remove(id: string, currentUser: CurrentUserData) {
    const vehicle = await this.findOne(id, currentUser);

    await this.vehicleRepository.remove(vehicle);

    return {
      message: 'Xóa xe thành công',
    };
  }

  async assignDriver(
    vehicleId: string,
    dto: AssignDriverDto,
    currentUser: CurrentUserData,
  ) {
    const vehicle = await this.findOne(vehicleId, currentUser);

    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ được phân tài xế cho xe đang hoạt động',
      );
    }

    const driver = await this.userRepository.findOne({
      where: {
        id: dto.driverId,
      },
    });

    if (!driver) {
      throw new BadRequestException('Tài xế không tồn tại');
    }

    if (driver.role !== UserRole.DRIVER) {
      throw new BadRequestException('Người được phân phải là tài xế');
    }

    if (driver.companyId !== vehicle.companyId) {
      throw new ForbiddenException(
        'Tài xế không thuộc cùng nhà xe với xe',
      );
    }

    const existedDriverAssignment = await this.assignmentRepository.findOne({
      where: {
        driverId: driver.id,
        date: dto.date,
        vehicleId: Not(vehicle.id),
      },
      relations: {
        vehicle: true,
      },
    });

    if (existedDriverAssignment) {
      throw new ConflictException(
        'Tài xế đã được phân lái xe khác trong ngày này',
      );
    }

    const existedVehicleAssignment = await this.assignmentRepository.findOne({
      where: {
        vehicleId: vehicle.id,
        date: dto.date,
      },
    });

    if (existedVehicleAssignment) {
      existedVehicleAssignment.driverId = driver.id;
      existedVehicleAssignment.companyId = vehicle.companyId;
      existedVehicleAssignment.note = dto.note || null;

      return this.assignmentRepository.save(existedVehicleAssignment);
    }

    const assignment = this.assignmentRepository.create({
      companyId: vehicle.companyId,
      vehicleId: vehicle.id,
      driverId: driver.id,
      date: dto.date,
      note: dto.note || null,
    });

    return this.assignmentRepository.save(assignment);
  }

  async findAssignments(vehicleId: string, currentUser: CurrentUserData) {
    const vehicle = await this.findOne(vehicleId, currentUser);

    return this.assignmentRepository.find({
      where: {
        vehicleId: vehicle.id,
      },
      relations: {
        driver: true,
      },
      order: {
        date: 'DESC',
      },
    });
  }

  async removeAssignment(
    vehicleId: string,
    assignmentId: string,
    currentUser: CurrentUserData,
  ) {
    const vehicle = await this.findOne(vehicleId, currentUser);

    const assignment = await this.assignmentRepository.findOne({
      where: {
        id: assignmentId,
        vehicleId: vehicle.id,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy lịch phân tài xế');
    }

    await this.assignmentRepository.remove(assignment);

    return {
      message: 'Hủy phân tài xế thành công',
    };
  }
}