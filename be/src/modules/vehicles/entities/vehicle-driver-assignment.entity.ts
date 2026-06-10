import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
  } from 'typeorm';
  import { Company } from '../../companies/entities/company.entity';
  import { User } from '../../users/entities/user.entity';
  import { Vehicle } from './vehicle.entity';
  
  @Entity('vehicle_driver_assignments')
  @Unique('UQ_vehicle_assignment_date', ['vehicleId', 'date'])
  @Unique('UQ_driver_assignment_date', ['driverId', 'date'])
  export class VehicleDriverAssignment {
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
  
    @Index()
    @Column({
      name: 'vehicle_id',
      type: 'uuid',
    })
    vehicleId: string;
  
    @ManyToOne(() => Vehicle, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'vehicle_id',
    })
    vehicle: Vehicle;
  
    @Index()
    @Column({
      name: 'driver_id',
      type: 'uuid',
    })
    driverId: string;
  
    @ManyToOne(() => User, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'driver_id',
    })
    driver: User;
  
    @Index()
    @Column({
      type: 'date',
    })
    date: string;
  
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