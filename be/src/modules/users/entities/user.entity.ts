import {
  DriverEmploymentType,
  UserRole,
  UserStatus,
} from 'src/enums/user.enums';
import { Company } from 'src/modules/companies/entities/company.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 255,
  })
  fullName: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 20,
  })
  phone: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email: string | null;

  @Column({
    name: 'password_hash',
    type: 'text',
    select: false,
  })
  passwordHash: string;

  @Column({
    name: 'refresh_token_hash',
    type: 'text',
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Index()
  @Column({
    name: 'company_id',
    type: 'uuid',
    nullable: true,
  })
  companyId: string | null;

  @ManyToOne(() => Company, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'company_id',
  })
  company: Company | null;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @Column({
    name: 'driver_employment_type',
    type: 'enum',
    enum: DriverEmploymentType,
    nullable: true,
  })
  driverEmploymentType: DriverEmploymentType | null;

  @Column({
    name: 'driver_license_documents',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  driverLicenseDocuments: string[];
  
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
