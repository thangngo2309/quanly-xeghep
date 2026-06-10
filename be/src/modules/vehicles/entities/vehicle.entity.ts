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
  import { Company } from '../../companies/entities/company.entity';
import { VehicleStatus, VehicleType } from 'src/enums/vehicle-type.enum';
  
  @Entity('vehicles')
  export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index()
    @Column({
      name: 'company_id',
      type: 'uuid',
    })
    companyId: string;
  
    @ManyToOne(() => Company, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'company_id',
    })
    company: Company;
  
    @Index({
      unique: true,
    })
    @Column({
      name: 'license_plate',
      type: 'varchar',
      length: 30,
    })
    licensePlate: string;
  
    @Column({
      name: 'vehicle_type',
      type: 'enum',
      enum: VehicleType,
    })
    vehicleType: VehicleType;
  
    @Column({
      name: 'seat_count',
      type: 'int',
    })
    seatCount: number;
  
    @Column({
      type: 'varchar',
      length: 100,
      nullable: true,
    })
    brand: string | null;
  
    @Column({
      type: 'varchar',
      length: 100,
      nullable: true,
    })
    model: string | null;
  
    @Column({
      type: 'varchar',
      length: 50,
      nullable: true,
    })
    color: string | null;
  
    @Column({
      name: 'production_year',
      type: 'int',
      nullable: true,
    })
    productionYear: number | null;
  
    @Column({
      name: 'registration_expiry_date',
      type: 'date',
      nullable: true,
    })
    registrationExpiryDate: string | null;
  
    @Column({
      type: 'enum',
      enum: VehicleStatus,
      default: VehicleStatus.ACTIVE,
    })
    status: VehicleStatus;
  
    @Column({
      type: 'text',
      nullable: true,
    })
    note: string | null;
  
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