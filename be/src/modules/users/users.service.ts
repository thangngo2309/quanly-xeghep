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
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { Company } from '../companies/entities/company.entity';
import { CompanyStatus, CompanyType } from 'src/enums/company.enum';
import { CreateOwnerOperatorDto } from './dto/create-owner-operator.dto';

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
    private readonly dataSource: DataSource,

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
  ): Promise<string | null> {
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
        role === UserRole.DRIVER
          ? 'Tài xế phải thuộc nhà xe hoặc được tạo theo loại chủ xe kinh doanh độc lập'
          : 'Vui lòng chọn nhà xe cho tài khoản quản trị',
      );
    }

    await this.ensureCompanyExists(dtoCompanyId);

    return dtoCompanyId;
  }

  async create(dto: CreateUserDto, currentUser: CurrentUserData) {
    const phone = dto.phone.trim();
    const email = dto.email?.trim().toLowerCase() || null;

    const existedPhone = await this.findByPhone(phone);

    if (existedPhone) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    if (email) {
      const existedEmail = await this.findByEmail(email);

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

    if (
      role === UserRole.DRIVER &&
      (!dto.driverLicenseDocuments || dto.driverLicenseDocuments.length === 0)
    ) {
      throw new BadRequestException(
        'Tài xế bắt buộc phải tải giấy phép lái xe',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      fullName: dto.fullName.trim(),
      phone,
      email,
      passwordHash,
      role,
      status: dto.status || UserStatus.ACTIVE,
      companyId,

      driverLicenseDocuments:
        role === UserRole.DRIVER ? dto.driverLicenseDocuments || [] : [],
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
      where: {
        id,
      },
      relations: {
        company: true,
      },
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
    const result = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const companyRepository = manager.getRepository(Company);

      /**
       * Chỉ khóa bảng users.
       *
       * Không LEFT JOIN company trong query có FOR UPDATE vì PostgreSQL
       * không cho khóa phía nullable của OUTER JOIN.
       */
      const user = await userRepository
        .createQueryBuilder('user')
        .where('user.id = :id', {
          id,
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      /**
       * Load company riêng để kiểm tra quyền và xác định OWNER_OPERATOR.
       */
      let currentCompany: Company | null = null;

      if (user.companyId) {
        currentCompany = await companyRepository.findOne({
          where: {
            id: user.companyId,
          },
        });
      }

      user.company = currentCompany;

      this.assertAdminCanAccessUser(currentUser, user);

      const isOwnerOperator =
        user.role === UserRole.DRIVER &&
        currentCompany?.companyType === CompanyType.OWNER_OPERATOR &&
        currentCompany.ownerUserId === user.id;

      /*
       * Cập nhật số điện thoại.
       */
      if (dto.phone !== undefined) {
        const phone = dto.phone.trim();

        if (phone !== user.phone) {
          const existedPhone = await userRepository.findOne({
            where: {
              phone,
            },
          });

          if (existedPhone && existedPhone.id !== user.id) {
            throw new ConflictException('Số điện thoại đã tồn tại');
          }
        }

        user.phone = phone;
      }

      /*
       * Cập nhật email.
       */
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase() || null;

        if (email && email !== user.email) {
          const existedEmail = await userRepository.findOne({
            where: {
              email,
            },
          });

          if (existedEmail && existedEmail.id !== user.id) {
            throw new ConflictException('Email đã tồn tại');
          }
        }

        user.email = email;
      }

      /*
       * Xử lý role và company.
       */
      if (currentUser.role === UserRole.ADMIN) {
        this.assertAdminHasCompany(currentUser);

        user.role = UserRole.DRIVER;
        user.companyId = currentUser.companyId;
      } else if (isOwnerOperator) {
        /**
         * Không cho đổi role hoặc chuyển nhà xe của tài xế chủ xe
         * trong màn hình quản lý người dùng.
         */
        if (dto.role && dto.role !== UserRole.DRIVER) {
          throw new BadRequestException(
            'Không thể thay đổi vai trò của tài xế chủ xe tại màn hình người dùng',
          );
        }

        if (dto.companyId !== undefined && dto.companyId !== user.companyId) {
          throw new BadRequestException(
            'Không thể chuyển tài xế chủ xe sang nhà xe khác tại màn hình người dùng',
          );
        }

        user.role = UserRole.DRIVER;
      } else {
        const nextRole = dto.role || user.role;

        if (nextRole === UserRole.SUPER_ADMIN) {
          user.role = UserRole.SUPER_ADMIN;
          user.companyId = null;
        } else {
          const nextCompanyId =
            dto.companyId !== undefined ? dto.companyId : user.companyId;

          if (!nextCompanyId) {
            throw new BadRequestException(
              nextRole === UserRole.DRIVER
                ? 'Tài xế bắt buộc phải thuộc một nhà xe'
                : 'Vui lòng chọn nhà xe cho tài khoản quản trị',
            );
          }

          const company = await companyRepository.findOne({
            where: {
              id: nextCompanyId,
            },
          });

          if (!company) {
            throw new BadRequestException('Nhà xe không tồn tại');
          }

          /**
           * Không cho gắn tài xế thông thường vào company OWNER_OPERATOR
           * của người khác.
           */
          if (
            nextRole === UserRole.DRIVER &&
            company.companyType === CompanyType.OWNER_OPERATOR &&
            company.ownerUserId !== user.id
          ) {
            throw new BadRequestException(
              'Không thể gắn tài xế vào đơn vị kinh doanh của chủ xe khác',
            );
          }

          user.role = nextRole;
          user.companyId = nextCompanyId;
        }
      }

      /*
       * Thông tin cơ bản.
       */
      if (dto.fullName !== undefined) {
        user.fullName = dto.fullName.trim();
      }

      if (dto.status !== undefined) {
        user.status = dto.status;
      }

      if (dto.password) {
        user.passwordHash = await bcrypt.hash(dto.password, 12);
      }

      /*
       * Giấy phép lái xe.
       */
      if (user.role === UserRole.DRIVER) {
        const nextDriverLicenseDocuments =
          dto.driverLicenseDocuments !== undefined
            ? dto.driverLicenseDocuments
            : user.driverLicenseDocuments || [];

        if (nextDriverLicenseDocuments.length === 0) {
          throw new BadRequestException(
            'Tài xế bắt buộc phải có giấy phép lái xe',
          );
        }

        user.driverLicenseDocuments = nextDriverLicenseDocuments;
      } else if (dto.driverLicenseDocuments !== undefined) {
        throw new BadRequestException(
          'Chỉ tài khoản tài xế mới được cập nhật giấy phép lái xe',
        );
      }

      await userRepository.save(user);

      /*
       * Cập nhật company ngay tại màn hình User chỉ khi đây là
       * tài xế chủ sở hữu của OWNER_OPERATOR.
       */
      if (dto.ownerCompany !== undefined) {
        if (!isOwnerOperator || !user.companyId) {
          throw new BadRequestException(
            'Chỉ tài xế chủ xe mới được cập nhật giấy đăng ký kinh doanh tại màn hình người dùng',
          );
        }

        /**
         * Khóa company bằng query riêng.
         */
        const ownerCompany = await companyRepository
          .createQueryBuilder('company')
          .where('company.id = :companyId', {
            companyId: user.companyId,
          })
          .setLock('pessimistic_write')
          .getOne();

        if (!ownerCompany) {
          throw new NotFoundException(
            'Không tìm thấy đơn vị kinh doanh của tài xế',
          );
        }

        if (
          ownerCompany.companyType !== CompanyType.OWNER_OPERATOR ||
          ownerCompany.ownerUserId !== user.id
        ) {
          throw new BadRequestException(
            'Đơn vị kinh doanh này không thuộc quyền sở hữu của tài xế',
          );
        }

        const ownerCompanyDto = dto.ownerCompany;

        if (ownerCompanyDto.name !== undefined) {
          const name = ownerCompanyDto.name.trim();

          if (!name) {
            throw new BadRequestException(
              'Tên đơn vị kinh doanh không được để trống',
            );
          }

          ownerCompany.name = name;
        }

        if (ownerCompanyDto.phone !== undefined) {
          ownerCompany.phone = ownerCompanyDto.phone.trim() || null;
        }

        if (ownerCompanyDto.email !== undefined) {
          ownerCompany.email =
            ownerCompanyDto.email.trim().toLowerCase() || null;
        }

        if (ownerCompanyDto.taxCode !== undefined) {
          const taxCode = ownerCompanyDto.taxCode.trim() || null;

          if (taxCode && taxCode !== ownerCompany.taxCode) {
            const existedTaxCode = await companyRepository.findOne({
              where: {
                taxCode,
              },
            });

            if (existedTaxCode && existedTaxCode.id !== ownerCompany.id) {
              throw new ConflictException('Mã số thuế đã tồn tại');
            }
          }

          ownerCompany.taxCode = taxCode;
        }

        if (ownerCompanyDto.representativeName !== undefined) {
          ownerCompany.representativeName =
            ownerCompanyDto.representativeName.trim() || null;
        }

        if (ownerCompanyDto.address !== undefined) {
          ownerCompany.address = ownerCompanyDto.address.trim() || null;
        }

        if (ownerCompanyDto.businessRegistrationNumber !== undefined) {
          const businessRegistrationNumber =
            ownerCompanyDto.businessRegistrationNumber.trim();

          if (!businessRegistrationNumber) {
            throw new BadRequestException(
              'Số đăng ký kinh doanh không được để trống',
            );
          }

          ownerCompany.businessRegistrationNumber = businessRegistrationNumber;
        }

        if (ownerCompanyDto.businessRegistrationIssuedDate !== undefined) {
          ownerCompany.businessRegistrationIssuedDate =
            ownerCompanyDto.businessRegistrationIssuedDate || null;
        }

        if (ownerCompanyDto.businessRegistrationIssuedPlace !== undefined) {
          ownerCompany.businessRegistrationIssuedPlace =
            ownerCompanyDto.businessRegistrationIssuedPlace.trim() || null;
        }

        if (ownerCompanyDto.businessRegistrationDocuments !== undefined) {
          if (ownerCompanyDto.businessRegistrationDocuments.length === 0) {
            throw new BadRequestException(
              'Tài xế chủ xe bắt buộc phải có giấy đăng ký kinh doanh',
            );
          }

          ownerCompany.businessRegistrationDocuments = Array.from(
            new Set(ownerCompanyDto.businessRegistrationDocuments),
          );
        }

        if (
          !ownerCompany.businessRegistrationDocuments ||
          ownerCompany.businessRegistrationDocuments.length === 0
        ) {
          throw new BadRequestException(
            'Tài xế chủ xe bắt buộc phải có giấy đăng ký kinh doanh',
          );
        }

        await companyRepository.save(ownerCompany);
      }

      return {
        userId: user.id,
      };
    });

    return this.findByIdOrFail(result.userId);
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

  private async generateOwnerOperatorCompanyCode(
    companyRepository: Repository<Company>,
    phone: string,
  ) {
    const phoneDigits = phone.replace(/\D/g, '');
    const suffix = phoneDigits.slice(-9) || Date.now().toString().slice(-9);
    const baseCode = `OWNER-${suffix}`.toUpperCase();

    const baseExisted = await companyRepository.findOne({
      where: {
        code: baseCode,
      },
    });

    if (!baseExisted) {
      return baseCode;
    }

    for (let index = 1; index <= 99; index += 1) {
      const code = `${baseCode}-${String(index).padStart(2, '0')}`;

      const existed = await companyRepository.findOne({
        where: {
          code,
        },
      });

      if (!existed) {
        return code;
      }
    }

    throw new ConflictException(
      'Không thể tự sinh mã đơn vị vận tải cho tài xế',
    );
  }

  async createOwnerOperator(
    dto: CreateOwnerOperatorDto,
    currentUser: CurrentUserData,
  ) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Chỉ Super Admin được tạo tài xế kinh doanh độc lập',
      );
    }

    const phone = dto.phone.trim();
    const email = dto.email?.trim().toLowerCase() || null;

    const result = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const companyRepository = manager.getRepository(Company);

      const existedPhone = await userRepository.findOne({
        where: {
          phone,
        },
      });

      if (existedPhone) {
        throw new ConflictException('Số điện thoại đã tồn tại');
      }

      if (email) {
        const existedEmail = await userRepository.findOne({
          where: {
            email,
          },
        });

        if (existedEmail) {
          throw new ConflictException('Email đã tồn tại');
        }
      }

      const companyCode = dto.company.code
        ? dto.company.code.trim().toUpperCase()
        : await this.generateOwnerOperatorCompanyCode(companyRepository, phone);

      const existedCompanyCode = await companyRepository.findOne({
        where: {
          code: companyCode,
        },
      });

      if (existedCompanyCode) {
        throw new ConflictException('Mã đơn vị vận tải đã tồn tại');
      }

      const taxCode = dto.company.taxCode?.trim() || null;

      if (taxCode) {
        const existedTaxCode = await companyRepository.findOne({
          where: {
            taxCode,
          },
        });

        if (existedTaxCode) {
          throw new ConflictException('Mã số thuế đã tồn tại');
        }
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);

      /**
       * Tạo user trước với companyId = null để tránh vòng khóa ngoại:
       * users.company_id -> companies.id
       * companies.owner_user_id -> users.id
       */
      const user = userRepository.create({
        fullName: dto.fullName.trim(),
        phone,
        email,
        passwordHash,
        role: UserRole.DRIVER,
        status: dto.status || UserStatus.ACTIVE,
        companyId: null,
        driverLicenseDocuments: dto.driverLicenseDocuments,
      });

      const savedUser = await userRepository.save(user);

      const companyName =
        dto.company.name?.trim() || `Hộ kinh doanh ${savedUser.fullName}`;

      const company = companyRepository.create({
        code: companyCode,
        name: companyName,

        phone: dto.company.phone?.trim() || savedUser.phone,
        email: dto.company.email?.trim().toLowerCase() || savedUser.email,

        taxCode,
        representativeName:
          dto.company.representativeName?.trim() || savedUser.fullName,

        address: dto.company.address?.trim() || null,

        status: dto.company.status || CompanyStatus.ACTIVE,
        note: dto.company.note?.trim() || null,

        companyType: CompanyType.OWNER_OPERATOR,
        ownerUserId: savedUser.id,

        businessRegistrationNumber:
          dto.company.businessRegistrationNumber?.trim() || null,

        businessRegistrationIssuedDate:
          dto.company.businessRegistrationIssuedDate || null,

        businessRegistrationIssuedPlace:
          dto.company.businessRegistrationIssuedPlace?.trim() || null,

        businessRegistrationDocuments:
          dto.company.businessRegistrationDocuments,
      });

      const savedCompany = await companyRepository.save(company);

      savedUser.companyId = savedCompany.id;

      await userRepository.save(savedUser);

      return {
        userId: savedUser.id,
        companyId: savedCompany.id,
      };
    });

    const user = await this.findByIdOrFail(result.userId);

    const company = await this.companyRepository.findOne({
      where: {
        id: result.companyId,
      },
    });

    return {
      user,
      company,
    };
  }

  private isOwnerOperatorUser(user: User) {
    return (
      user.role === UserRole.DRIVER &&
      user.company?.companyType === CompanyType.OWNER_OPERATOR &&
      user.company.ownerUserId === user.id
    );
  }
}
