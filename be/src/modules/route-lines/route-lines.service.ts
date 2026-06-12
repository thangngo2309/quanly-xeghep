import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';
import { TransportRoute } from '../routes/entities/route.entity';
import { CreateRouteLineDto } from './dto/create-route-line.dto';
import { ListRouteLinesQueryDto } from './dto/list-route-lines-query.dto';
import { UpdateRouteLineDto } from './dto/update-route-line.dto';
import { RouteLine } from './entities/route-line.entity';
import { UserRole } from 'src/enums/user.enums';
import { RouteDirection, RouteLineStatus } from 'src/enums/route-line.enum';
import { TransportRouteStatus } from 'src/enums/transport-route.enum';

@Injectable()
export class RouteLinesService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(RouteLine)
    private readonly routeLineRepository: Repository<RouteLine>,

    @InjectRepository(TransportRoute)
    private readonly routeRepository: Repository<TransportRoute>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

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

  private async resolveCompanyId(
    dtoCompanyId: string | undefined,
    currentUser: CurrentUserData,
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);

      return currentUser.companyId as string;
    }

    if (!dtoCompanyId) {
      throw new BadRequestException('Vui lòng chọn nhà xe');
    }

    await this.ensureCompanyExists(dtoCompanyId);

    return dtoCompanyId;
  }

  private assertCanAccessRouteLine(
    currentUser: CurrentUserData,
    routeLine: RouteLine,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      return;
    }

    this.assertAdminHasCompany(currentUser);

    if (routeLine.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tuyến khai thác của nhà xe khác',
      );
    }
  }

  private normalizeStops(stops?: string[]) {
    return (stops || [])
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private buildRouteName(points: string[]) {
    return points.join(' - ');
  }

  private buildRoutePayload(
    routeLine: RouteLine,
    direction: RouteDirection,
    oppositeRouteId?: string | null,
  ) {
    const middleStops = routeLine.middleStops || [];

    if (direction === RouteDirection.OUTBOUND) {
      const points = [
        routeLine.startPoint,
        ...middleStops,
        routeLine.endPoint,
      ];

      return {
        companyId: routeLine.companyId,
        routeLineId: routeLine.id,
        direction,
        oppositeRouteId: oppositeRouteId || null,
        name: this.buildRouteName(points),
        origin: routeLine.startPoint,
        destination: routeLine.endPoint,
        stops: middleStops.length ? middleStops : null,
        estimatedDurationMinutes: routeLine.defaultDurationMinutes,
        status: TransportRouteStatus.ACTIVE,
        note: routeLine.note,
      };
    }

    const reversedStops = [...middleStops].reverse();
    const points = [
      routeLine.endPoint,
      ...reversedStops,
      routeLine.startPoint,
    ];

    return {
      companyId: routeLine.companyId,
      routeLineId: routeLine.id,
      direction,
      oppositeRouteId: oppositeRouteId || null,
      name: this.buildRouteName(points),
      origin: routeLine.endPoint,
      destination: routeLine.startPoint,
      stops: reversedStops.length ? reversedStops : null,
      estimatedDurationMinutes: routeLine.defaultDurationMinutes,
      status: RouteLineStatus.ACTIVE as any,
      note: routeLine.note,
    };
  }

  async create(dto: CreateRouteLineDto, currentUser: CurrentUserData) {
    const companyId = await this.resolveCompanyId(dto.companyId, currentUser);
  
    const startPoint = dto.startPoint.trim();
    const endPoint = dto.endPoint.trim();
  
    if (startPoint === endPoint) {
      throw new BadRequestException('Điểm đầu và điểm cuối không được trùng nhau');
    }
  
    const middleStops = this.normalizeStops(dto.middleStops);
  
    const name = dto.name?.trim() || `${startPoint} ⇄ ${endPoint}`;
  
    const existed = await this.routeLineRepository.findOne({
      where: {
        companyId,
        name,
      },
    });
  
    if (existed) {
      throw new ConflictException(
        'Tên tuyến khai thác đã tồn tại trong nhà xe này',
      );
    }
  
    const savedRouteLineId = await this.dataSource.transaction(
      async (manager) => {
        const routeLineRepository = manager.getRepository(RouteLine);
        const routeRepository = manager.getRepository(TransportRoute);
  
        const routeLine = routeLineRepository.create({
          companyId,
          name,
          startPoint,
          endPoint,
          middleStops: middleStops.length ? middleStops : null,
          defaultDurationMinutes: dto.defaultDurationMinutes || null,
          defaultTurnaroundMinutes: dto.defaultTurnaroundMinutes ?? 30,
          status: dto.status || RouteLineStatus.ACTIVE,
          note: dto.note || null,
        });
  
        const savedRouteLine = await routeLineRepository.save(routeLine);
  
        const outboundRoute = routeRepository.create(
          this.buildRoutePayload(
            savedRouteLine,
            RouteDirection.OUTBOUND,
            null,
          ),
        );
  
        const savedOutboundRoute = await routeRepository.save(outboundRoute);
  
        if (dto.createReturnRoute !== false) {
          const returnRoute = routeRepository.create(
            this.buildRoutePayload(
              savedRouteLine,
              RouteDirection.RETURN,
              savedOutboundRoute.id,
            ),
          );
  
          const savedReturnRoute = await routeRepository.save(returnRoute);
  
          savedOutboundRoute.oppositeRouteId = savedReturnRoute.id;
  
          await routeRepository.save(savedOutboundRoute);
        }
  
        return savedRouteLine.id;
      },
    );
  
    return this.findOne(savedRouteLineId, currentUser);
  }

  async findAll(query: ListRouteLinesQueryDto, currentUser: CurrentUserData) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      name: 'routeLine.name',
      startPoint: 'routeLine.start_point',
      endPoint: 'routeLine.end_point',
      status: 'routeLine.status',
      createdAt: 'routeLine.created_at',
      updatedAt: 'routeLine.updated_at',
    };

    const qb = this.routeLineRepository
      .createQueryBuilder('routeLine')
      .leftJoinAndSelect('routeLine.company', 'company')
      .leftJoinAndSelect('routeLine.routes', 'routes');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          routeLine.name ILIKE :keyword
          OR routeLine.start_point ILIKE :keyword
          OR routeLine.end_point ILIKE :keyword
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

      qb.andWhere('routeLine.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    } else if (query.companyId) {
      qb.andWhere('routeLine.company_id = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.status) {
      qb.andWhere('routeLine.status = :status', {
        status: query.status,
      });
    }

    qb.orderBy(
      sortColumnMap[sortBy] || 'routeLine.created_at',
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
    const routeLine = await this.routeLineRepository.findOne({
      where: {
        id,
      },
      relations: {
        company: true,
        routes: true,
      },
    });

    if (!routeLine) {
      throw new NotFoundException('Không tìm thấy tuyến khai thác');
    }

    this.assertCanAccessRouteLine(currentUser, routeLine);

    return routeLine;
  }

  async update(
    id: string,
    dto: UpdateRouteLineDto,
    currentUser: CurrentUserData,
  ) {
    const routeLine = await this.findOne(id, currentUser);

    if (currentUser.role === UserRole.SUPER_ADMIN && dto.companyId) {
      await this.ensureCompanyExists(dto.companyId);
      routeLine.companyId = dto.companyId;
    }

    if (dto.name !== undefined) {
      routeLine.name = dto.name.trim();
    }

    if (dto.startPoint !== undefined) {
      routeLine.startPoint = dto.startPoint.trim();
    }

    if (dto.endPoint !== undefined) {
      routeLine.endPoint = dto.endPoint.trim();
    }

    if (dto.middleStops !== undefined) {
      const middleStops = this.normalizeStops(dto.middleStops);
      routeLine.middleStops = middleStops.length ? middleStops : null;
    }

    if (dto.defaultDurationMinutes !== undefined) {
      routeLine.defaultDurationMinutes = dto.defaultDurationMinutes || null;
    }

    if (dto.defaultTurnaroundMinutes !== undefined) {
      routeLine.defaultTurnaroundMinutes = dto.defaultTurnaroundMinutes;
    }

    if (dto.status !== undefined) {
      routeLine.status = dto.status;
    }

    if (dto.note !== undefined) {
      routeLine.note = dto.note || null;
    }

    const savedRouteLine = await this.routeLineRepository.save(routeLine);

    return this.findOne(savedRouteLine.id, currentUser);
  }

  async remove(id: string, currentUser: CurrentUserData) {
    const routeLine = await this.findOne(id, currentUser);

    await this.routeLineRepository.remove(routeLine);

    return {
      message: 'Xóa tuyến khai thác thành công',
    };
  }
}