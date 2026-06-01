import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { SuperAdminSeed } from './super-admin.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [SuperAdminSeed],
})
export class SeedsModule {}