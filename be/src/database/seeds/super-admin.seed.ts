import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole, UserStatus } from 'src/enums/user.enums';

@Injectable()
export class SuperAdminSeed implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const enabled = this.configService.get<string>('SEED_SUPER_ADMIN');

    if (enabled !== 'true') {
      return;
    }

    const phone =
      this.configService.get<string>('SUPER_ADMIN_PHONE') || '0900000000';

    const email =
      this.configService.get<string>('SUPER_ADMIN_EMAIL') ||
      'superadmin@example.com';

    const fullName =
      this.configService.get<string>('SUPER_ADMIN_FULL_NAME') || 'Super Admin';

    const password =
      this.configService.get<string>('SUPER_ADMIN_PASSWORD') || 'Admin@123456';

    const existedSuperAdmin = await this.userRepository.findOne({
      where: [
        {
          phone,
        },
        {
          email,
        },
      ],
    });

    if (existedSuperAdmin) {
      console.log('[Seed] Super admin already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const superAdmin = this.userRepository.create({
      fullName,
      phone,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(superAdmin);

    console.log('[Seed] Super admin created successfully');
    console.log(`[Seed] Phone: ${phone}`);
    console.log(`[Seed] Email: ${email}`);
  }
}