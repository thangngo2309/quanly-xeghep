import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs';

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
  ) {}


  async create(dto: CreateUserDto) {
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

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email || null,
      passwordHash,
      role: dto.role || UserRole.ADMIN,
      status: UserStatus.ACTIVE,
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

  findAll() {
    return this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
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

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findByIdOrFail(id);

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

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName;
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }

    if (dto.email !== undefined) {
      user.email = dto.email || null;
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const savedUser = await this.userRepository.save(user);

    return this.findByIdOrFail(savedUser.id);
  }

  async remove(id: string) {
    const user = await this.findByIdOrFail(id);

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
