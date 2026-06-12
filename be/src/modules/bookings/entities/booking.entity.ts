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
  import { Trip } from '../../trips/entities/trip.entity';
import { BookingStatus } from 'src/enums/booking-status.enum';
  
  @Entity('bookings')
  export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index({ unique: true })
    @Column({
      name: 'booking_code',
      type: 'varchar',
      length: 50,
    })
    bookingCode: string;
  
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
      name: 'trip_id',
      type: 'uuid',
    })
    tripId: string;
  
    @ManyToOne(() => Trip, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'trip_id',
    })
    trip: Trip;
  
    @Column({
      name: 'customer_name',
      type: 'varchar',
      length: 255,
    })
    customerName: string;
  
    @Index()
    @Column({
      name: 'customer_phone',
      type: 'varchar',
      length: 20,
    })
    customerPhone: string;
  
    @Column({
      name: 'customer_email',
      type: 'varchar',
      length: 255,
      nullable: true,
    })
    customerEmail: string | null;
  
    @Column({
      name: 'passenger_count',
      type: 'int',
      default: 1,
    })
    passengerCount: number;
  
    @Column({
      name: 'pickup_address',
      type: 'text',
      nullable: true,
    })
    pickupAddress: string | null;
  
    @Column({
      name: 'dropoff_address',
      type: 'text',
      nullable: true,
    })
    dropoffAddress: string | null;

    @Column({
      name: 'pickup_lat',
      type: 'double precision',
      nullable: true,
    })
    pickupLat: number | null;
    
    @Column({
      name: 'pickup_lng',
      type: 'double precision',
      nullable: true,
    })
    pickupLng: number | null;
    
    @Column({
      name: 'dropoff_lat',
      type: 'double precision',
      nullable: true,
    })
    dropoffLat: number | null;
    
    @Column({
      name: 'dropoff_lng',
      type: 'double precision',
      nullable: true,
    })
    dropoffLng: number | null;
  
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
      name: 'seat_price',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: true,
    })
    seatPrice: string | null;
  
    @Column({
      name: 'total_amount',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: true,
    })
    totalAmount: string | null;
  
    @Column({
      type: 'enum',
      enum: BookingStatus,
      default: BookingStatus.CONFIRMED,
    })
    status: BookingStatus;
  
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