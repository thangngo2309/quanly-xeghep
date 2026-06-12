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
  import { User } from '../../users/entities/user.entity';
  import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { RouteScheduleTemplate } from './route-schedule.entity';
import { RouteScheduleStatus } from 'src/enums/route-schedule.enum';
import { RouteDirection } from 'src/enums/route-line.enum';
  
  @Entity('route_schedule_vehicles')
  export class RouteScheduleVehicle {
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
      name: 'schedule_id',
      type: 'uuid',
    })
    scheduleId: string;
  
    @ManyToOne(() => RouteScheduleTemplate, (schedule) => schedule.vehicles, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'schedule_id',
    })
    schedule: RouteScheduleTemplate;
  
    @Index()
    @Column({
      name: 'vehicle_id',
      type: 'uuid',
    })
    vehicleId: string;
  
    @ManyToOne(() => Vehicle, {
      nullable: false,
      onDelete: 'RESTRICT',
    })
    @JoinColumn({
      name: 'vehicle_id',
    })
    vehicle: Vehicle;
  
    @Index()
    @Column({
      name: 'driver_id',
      type: 'uuid',
      nullable: true,
    })
    driverId: string | null;
  
    @ManyToOne(() => User, {
      nullable: true,
      onDelete: 'SET NULL',
    })
    @JoinColumn({
      name: 'driver_id',
    })
    driver: User | null;
  
    @Column({
      name: 'start_direction',
      type: 'enum',
      enum: RouteDirection,
    })
    startDirection: RouteDirection;
  
    @Column({
      name: 'first_departure_time',
      type: 'varchar',
      length: 5,
    })
    firstDepartureTime: string;
  
    @Column({
      name: 'active_from',
      type: 'date',
    })
    activeFrom: string;
  
    @Column({
      name: 'active_to',
      type: 'date',
      nullable: true,
    })
    activeTo: string | null;
  
    @Column({
      type: 'enum',
      enum: RouteScheduleStatus,
      default: RouteScheduleStatus.ACTIVE,
    })
    status: RouteScheduleStatus;
  
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