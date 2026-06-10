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
  import { TransportRoute } from '../../routes/entities/route.entity';
  import { User } from '../../users/entities/user.entity';
  import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { TripStatus } from 'src/enums/trip-status.enum';
  
  @Entity('trips')
  export class Trip {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index({ unique: true })
    @Column({
      name: 'trip_code',
      type: 'varchar',
      length: 50,
    })
    tripCode: string;
  
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
      name: 'route_id',
      type: 'uuid',
    })
    routeId: string;
  
    @ManyToOne(() => TransportRoute, {
      nullable: false,
      onDelete: 'RESTRICT',
    })
    @JoinColumn({
      name: 'route_id',
    })
    route: TransportRoute;
  
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
    })
    driverId: string;
  
    @ManyToOne(() => User, {
      nullable: false,
      onDelete: 'RESTRICT',
    })
    @JoinColumn({
      name: 'driver_id',
    })
    driver: User;
  
    @Index()
    @Column({
      name: 'departure_time',
      type: 'timestamptz',
    })
    departureTime: Date;
  
    @Column({
      name: 'expected_arrival_time',
      type: 'timestamptz',
      nullable: true,
    })
    expectedArrivalTime: Date | null;
  
    @Column({
      name: 'total_seats',
      type: 'int',
    })
    totalSeats: number;
  
    @Column({
      name: 'booked_seats',
      type: 'int',
      default: 0,
    })
    bookedSeats: number;
  
    @Column({
      name: 'base_price',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: true,
    })
    basePrice: string | null;
  
    @Column({
      type: 'enum',
      enum: TripStatus,
      default: TripStatus.SCHEDULED,
    })
    status: TripStatus;
  
    @Column({
      name: 'pickup_note',
      type: 'text',
      nullable: true,
    })
    pickupNote: string | null;
  
    @Column({
      name: 'dropoff_note',
      type: 'text',
      nullable: true,
    })
    dropoffNote: string | null;
  
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