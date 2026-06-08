import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';

type CreateUserByAuthInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  passwordHash: string;
  role?: UserRole;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

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
  
  private assertAdminHasCompany(currentUser: CurrentUserData) {
    if (currentUser.role === UserRole.ADMIN && !currentUser.companyId) {
      throw new ForbiddenException('Tài khoản admin chưa được gán nhà xe');
    }
  }
  
  private assertAdminCanAccessUser(currentUser: CurrentUserData, user: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      return;
    }
  
    this.assertAdminHasCompany(currentUser);
  
    if (user.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập người dùng của nhà xe khác',
      );
    }
  
    if (user.role !== UserRole.DRIVER) {
      throw new ForbiddenException(
        'Admin nhà xe chỉ được quản lý tài khoản tài xế',
      );
    }
  }
  
  private async resolveCompanyIdForCreate(
    role: UserRole,
    dtoCompanyId: string | undefined,
    currentUser: CurrentUserData,
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);
  
      if (role !== UserRole.DRIVER) {
        throw new ForbiddenException(
          'Admin nhà xe chỉ được tạo tài khoản tài xế',
        );
      }
  
      return currentUser.companyId;
    }
  
    if (role === UserRole.SUPER_ADMIN) {
      return null;
    }
  
    if (!dtoCompanyId) {
      throw new BadRequestException(
        'Vui lòng chọn nhà xe cho tài khoản Admin hoặc Tài xế',
      );
    }
  
    await this.ensureCompanyExists(dtoCompanyId);
  
    return dtoCompanyId;
  }

  async create(dto: CreateUserDto, currentUser: CurrentUserData) {
    const existedPhone = await this.findByPhone(dto.phone);
  
    if (existedPhone) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }
  
    if (dto.email) {
      const existedEmail = await this.findByEmail(dto.email);
  
      if (existedEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
    }
  
    const role =
      currentUser.role === UserRole.ADMIN
        ? UserRole.DRIVER
        : dto.role || UserRole.ADMIN;
  
    const companyId = await this.resolveCompanyIdForCreate(
      role,
      dto.companyId,
      currentUser,
    );
  
    const passwordHash = await bcrypt.hash(dto.password, 12);
  
    const user = this.userRepository.create({
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      email: dto.email || null,
      passwordHash,
      role,
      status: dto.status || UserStatus.ACTIVE,
      companyId,
    });
  
    const savedUser = await this.userRepository.save(user);
  
    return this.findByIdOrFail(savedUser.id);
  }

  async createByAuth(input: CreateUserByAuthInput) {
    const user = this.userRepository.create({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || null,
      passwordHash: input.passwordHash,
      role: input.role || UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    return this.findByIdOrFail(savedUser.id);
  }

  async findAll(query: ListUsersQueryDto, currentUser: CurrentUserData) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;
  
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
  
    const sortColumnMap: Record<string, string> = {
      fullName: 'user.full_name',
      phone: 'user.phone',
      email: 'user.email',
      role: 'user.role',
      status: 'user.status',
      createdAt: 'user.created_at',
      updatedAt: 'user.updated_at',
      lastLoginAt: 'user.last_login_at',
    };
  
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company');
  
    if (query.keyword) {
      const keyword = `%${query.keyword}%`;
  
      qb.andWhere(
        `
        (
          user.full_name ILIKE :keyword
          OR user.phone ILIKE :keyword
          OR user.email ILIKE :keyword
          OR company.name ILIKE :keyword
          OR company.code ILIKE :keyword
        )
        `,
        { keyword },
      );
    }
  
    if (currentUser.role === UserRole.ADMIN) {
      this.assertAdminHasCompany(currentUser);
  
      qb.andWhere('user.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
  
      qb.andWhere('user.role = :role', {
        role: UserRole.DRIVER,
      });
    } else {
      if (query.companyId) {
        qb.andWhere('user.company_id = :companyId', {
          companyId: query.companyId,
        });
      }
  
      if (query.role) {
        qb.andWhere('user.role = :role', {
          role: query.role,
        });
      }
    }
  
    if (query.status) {
      qb.andWhere('user.status = :status', {
        status: query.status,
      });
    }
  
    qb.orderBy(
      sortColumnMap[sortBy] || 'user.created_at',
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

  async findOne(id: string) {
    return this.findByIdOrFail(id);
  }

  findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByIdOrFail(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  findByPhone(phone: string) {
    return this.userRepository.findOne({
      where: { phone },
    });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  findByIdentifierWithPassword(identifier: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.phone = :identifier OR user.email = :identifier', {
        identifier,
      })
      .getOne();
  }

  findByIdWithRefreshToken(id: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto, currentUser: CurrentUserData) {
    const user = await this.findByIdOrFail(id);
  
    this.assertAdminCanAccessUser(currentUser, user);
  
    if (dto.phone && dto.phone !== user.phone) {
      const existedPhone = await this.findByPhone(dto.phone);
  
      if (existedPhone) {
        throw new ConflictException('Số điện thoại đã tồn tại');
      }
    }
  
    if (dto.email && dto.email !== user.email) {
      const existedEmail = await this.findByEmail(dto.email);
  
      if (existedEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
    }
  
    if (currentUser.role === UserRole.ADMIN) {
      user.role = UserRole.DRIVER;
      user.companyId = currentUser.companyId;
    } else {
      const nextRole = dto.role || user.role;
  
      if (nextRole === UserRole.SUPER_ADMIN) {
        user.role = UserRole.SUPER_ADMIN;
        user.companyId = null;
      } else {
        const nextCompanyId =
          dto.companyId !== undefined ? dto.companyId || null : user.companyId;
  
        if (!nextCompanyId) {
          throw new BadRequestException(
            'Vui lòng chọn nhà xe cho tài khoản Admin hoặc Tài xế',
          );
        }
  
        await this.ensureCompanyExists(nextCompanyId);
  
        user.role = nextRole;
        user.companyId = nextCompanyId;
      }
    }
  
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
  
    if (dto.phone !== undefined) {
      user.phone = dto.phone.trim();
    }
  
    if (dto.email !== undefined) {
      user.email = dto.email || null;
    }
  
    if (dto.status !== undefined) {
      user.status = dto.status;
    }
  
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }
  
    const savedUser = await this.userRepository.save(user);
  
    return this.findByIdOrFail(savedUser.id);
  }

  async remove(id: string, currentUser: CurrentUserData) {
    const user = await this.findByIdOrFail(id);
  
    this.assertAdminCanAccessUser(currentUser, user);
  
    await this.userRepository.remove(user);
  
    return {
      message: 'Xóa người dùng thành công',
    };
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ) {
    await this.userRepository.update(userId, {
      refreshTokenHash,
    });
  }

  async updateLastLoginAt(userId: string) {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }
}
