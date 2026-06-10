import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { AssignRouteDriverDto } from './dto/assign-route-driver.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { ListRoutesQueryDto } from './dto/list-routes-query.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteDriverAssignment } from './entities/route-driver-assignment.entity';
import { TransportRoute } from './entities/route.entity';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { RouteDriverAssignmentStatus, TransportRouteStatus } from 'src/enums/transport-route-status.enum';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(TransportRoute)
    private readonly routeRepository: Repository<TransportRoute>,

    @InjectRepository(RouteDriverAssignment)
    private readonly assignmentRepository: Repository<RouteDriverAssignment>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private getTodayDateString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
      throw new BadRequestException('Vui lòng chọn nhà xe cho tuyến đường');
    }

    await this.ensureCompanyExists(dtoCompanyId);

    return dtoCompanyId;
  }

  private assertCanAccessRoute(
    currentUser: CurrentUserData,
    route: TransportRoute,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      return;
    }

    this.assertAdminHasCompany(currentUser);

    if (route.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tuyến đường của nhà xe khác',
      );
    }
  }

  async create(dto: CreateRouteDto, currentUser: CurrentUserData) {
    const companyId = await this.resolveCompanyIdForCreate(
      dto.companyId,
      currentUser,
    );

    const name = dto.name.trim();

    const existed = await this.routeRepository.findOne({
      where: {
        companyId,
        name,
      },
    });

    if (existed) {
      throw new ConflictException('Tên tuyến đường đã tồn tại trong nhà xe này');
    }

    const route = this.routeRepository.create({
      companyId,
      name,
      origin: dto.origin.trim(),
      destination: dto.destination.trim(),
      stops: dto.stops?.length ? dto.stops : null,
      distanceKm:
        dto.distanceKm !== undefined && dto.distanceKm !== null
          ? String(dto.distanceKm)
          : null,
      estimatedDurationMinutes: dto.estimatedDurationMinutes || null,
      status: dto.status || TransportRouteStatus.ACTIVE,
      note: dto.note || null,
    });

    const savedRoute = await this.routeRepository.save(route);

    return this.findOne(savedRoute.id, currentUser);
  }

  async findAll(query: ListRoutesQueryDto, currentUser: CurrentUserData) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      name: 'transportRoute.name',
      origin: 'transportRoute.origin',
      destination: 'transportRoute.destination',
      distanceKm: 'transportRoute.distance_km',
      estimatedDurationMinutes:
        'transportRoute.estimated_duration_minutes',
      status: 'transportRoute.status',
      createdAt: 'transportRoute.created_at',
      updatedAt: 'transportRoute.updated_at',
    };

    const qb = this.routeRepository
      .createQueryBuilder('transportRoute')
      .leftJoinAndSelect('transportRoute.company', 'company');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          transportRoute.name ILIKE :keyword
          OR transportRoute.origin ILIKE :keyword
          OR transportRoute.destination ILIKE :keyword
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

      qb.andWhere('transportRoute.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    } else if (query.companyId) {
      qb.andWhere('transportRoute.company_id = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.status) {
      qb.andWhere('transportRoute.status = :status', {
        status: query.status,
      });
    }

    qb.orderBy(
      sortColumnMap[sortBy] || 'transportRoute.created_at',
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: CurrentUserData) {
    const route = await this.routeRepository.findOne({
      where: {
        id,
      },
      relations: {
        company: true,
      },
    });

    if (!route) {
      throw new NotFoundException('Không tìm thấy tuyến đường');
    }

    this.assertCanAccessRoute(currentUser, route);

    return route;
  }

  async update(
    id: string,
    dto: UpdateRouteDto,
    currentUser: CurrentUserData,
  ) {
    const route = await this.findOne(id, currentUser);

    if (currentUser.role !== UserRole.ADMIN && dto.companyId !== undefined) {
      if (!dto.companyId) {
        throw new BadRequestException('Vui lòng chọn nhà xe cho tuyến đường');
      }

      await this.ensureCompanyExists(dto.companyId);

      route.companyId = dto.companyId;
    }

    if (dto.name !== undefined) {
      route.name = dto.name.trim();
    }

    if (dto.origin !== undefined) {
      route.origin = dto.origin.trim();
    }

    if (dto.destination !== undefined) {
      route.destination = dto.destination.trim();
    }

    if (dto.stops !== undefined) {
      route.stops = dto.stops?.length ? dto.stops : null;
    }

    if (dto.distanceKm !== undefined) {
      route.distanceKm =
        dto.distanceKm !== null ? String(dto.distanceKm) : null;
    }

    if (dto.estimatedDurationMinutes !== undefined) {
      route.estimatedDurationMinutes =
        dto.estimatedDurationMinutes || null;
    }

    if (dto.status !== undefined) {
      route.status = dto.status;
    }

    if (dto.note !== undefined) {
      route.note = dto.note || null;
    }

    const savedRoute = await this.routeRepository.save(route);

    return this.findOne(savedRoute.id, currentUser);
  }

  async remove(id: string, currentUser: CurrentUserData) {
    const route = await this.findOne(id, currentUser);

    await this.routeRepository.remove(route);

    return {
      message: 'Xóa tuyến đường thành công',
    };
  }

  async assignDriver(
    routeId: string,
    dto: AssignRouteDriverDto,
    currentUser: CurrentUserData,
  ) {
    const route = await this.findOne(routeId, currentUser);

    if (route.status !== TransportRouteStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ được phân tài xế cho tuyến đang hoạt động',
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

    if (driver.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Tài xế không ở trạng thái hoạt động');
    }

    if (driver.companyId !== route.companyId) {
      throw new ForbiddenException(
        'Tài xế không thuộc cùng nhà xe với tuyến đường',
      );
    }

    const startedAt = dto.startedAt || this.getTodayDateString();

    const activeAssignment = await this.assignmentRepository.findOne({
      where: {
        driverId: driver.id,
        status: RouteDriverAssignmentStatus.ACTIVE,
      },
    });

    if (activeAssignment) {
      if (activeAssignment.routeId === route.id) {
        activeAssignment.note = dto.note || activeAssignment.note;
        activeAssignment.startedAt = startedAt;

        return this.assignmentRepository.save(activeAssignment);
      }

      activeAssignment.status = RouteDriverAssignmentStatus.ENDED;
      activeAssignment.endedAt = startedAt;

      await this.assignmentRepository.save(activeAssignment);
    }

    const assignment = this.assignmentRepository.create({
      companyId: route.companyId,
      routeId: route.id,
      driverId: driver.id,
      startedAt,
      endedAt: null,
      status: RouteDriverAssignmentStatus.ACTIVE,
      note: dto.note || null,
    });

    return this.assignmentRepository.save(assignment);
  }

  async findDrivers(routeId: string, currentUser: CurrentUserData) {
    const route = await this.findOne(routeId, currentUser);

    return this.assignmentRepository.find({
      where: {
        routeId: route.id,
        status: RouteDriverAssignmentStatus.ACTIVE,
      },
      relations: {
        driver: true,
      },
      order: {
        startedAt: 'DESC',
      },
    });
  }

  async endDriverAssignment(
    routeId: string,
    assignmentId: string,
    currentUser: CurrentUserData,
  ) {
    const route = await this.findOne(routeId, currentUser);

    const assignment = await this.assignmentRepository.findOne({
      where: {
        id: assignmentId,
        routeId: route.id,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy phân công tài xế');
    }

    assignment.status = RouteDriverAssignmentStatus.ENDED;
    assignment.endedAt = this.getTodayDateString();

    await this.assignmentRepository.save(assignment);

    return {
      message: 'Đã kết thúc phân công tài xế',
    };
  }
}