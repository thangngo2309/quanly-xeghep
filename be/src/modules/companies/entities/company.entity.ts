import { CompanyStatus, CompanyType } from 'src/enums/company.enum';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 50,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email: string | null;

  @Column({
    name: 'tax_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  taxCode: string | null;

  @Column({
    name: 'representative_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  representativeName: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  address: string | null;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  note: string | null;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @Column({
    name: 'company_type',
    type: 'enum',
    enum: CompanyType,
    default: CompanyType.TRANSPORT_COMPANY,
  })
  companyType: CompanyType;

  @Column({
    name: 'owner_user_id',
    type: 'uuid',
    nullable: true,
  })
  ownerUserId: string | null;

  @Column({
    name: 'business_registration_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  businessRegistrationNumber: string | null;

  @Column({
    name: 'business_registration_issued_date',
    type: 'date',
    nullable: true,
  })
  businessRegistrationIssuedDate: string | null;

  @Column({
    name: 'business_registration_issued_place',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  businessRegistrationIssuedPlace: string | null;

  @Column({
    name: 'business_registration_documents',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  businessRegistrationDocuments: string[];

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
