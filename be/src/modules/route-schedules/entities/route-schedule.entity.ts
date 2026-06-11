import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Company } from '../../companies/entities/company.entity';
  import { RouteLine } from '../../route-lines/entities/route-line.entity';
import { TripStatus } from 'src/enums/trip-status.enum';
import { RouteScheduleStatus } from 'src/enums/route-schedule-status.enum';
import { RouteScheduleVehicle } from './route-schedule-vehicle.entity';
  
  @Entity('route_schedule_templates')
  export class RouteScheduleTemplate {
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
      name: 'route_line_id',
      type: 'uuid',
    })
    routeLineId: string;
  
    @ManyToOne(() => RouteLine, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'route_line_id',
    })
    routeLine: RouteLine;
  
    @Column({
      type: 'varchar',
      length: 255,
    })
    name: string;
  
    @Column({
      name: 'start_time',
      type: 'varchar',
      length: 5,
    })
    startTime: string;
  
    @Column({
      name: 'end_time',
      type: 'varchar',
      length: 5,
    })
    endTime: string;
  
    @Column({
      name: 'headway_minutes',
      type: 'int',
    })
    headwayMinutes: number;
  
    @Column({
      name: 'outbound_duration_minutes',
      type: 'int',
    })
    outboundDurationMinutes: number;
  
    @Column({
      name: 'return_duration_minutes',
      type: 'int',
    })
    returnDurationMinutes: number;
  
    @Column({
      name: 'turnaround_at_end_minutes',
      type: 'int',
      default: 30,
    })
    turnaroundAtEndMinutes: number;
  
    @Column({
      name: 'turnaround_at_start_minutes',
      type: 'int',
      default: 30,
    })
    turnaroundAtStartMinutes: number;
  
    @Column({
      name: 'days_of_week',
      type: 'jsonb',
    })
    daysOfWeek: number[];
  
    @Column({
      name: 'generate_days_ahead',
      type: 'int',
      default: 15,
    })
    generateDaysAhead: number;
  
    @Column({
      name: 'default_base_price',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: true,
    })
    defaultBasePrice: string | null;
  
    @Column({
      name: 'default_trip_status',
      type: 'enum',
      enum: TripStatus,
      default: TripStatus.OPEN,
    })
    defaultTripStatus: TripStatus;
  
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
  
    @OneToMany(() => RouteScheduleVehicle, (vehicle) => vehicle.schedule)
    vehicles: RouteScheduleVehicle[];
  
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