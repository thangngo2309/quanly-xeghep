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
  import { TransportRoute } from './route.entity';
import { RouteDriverAssignmentStatus } from 'src/enums/transport-route-status.enum';
  
  @Entity('route_driver_assignments')
  export class RouteDriverAssignment {
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
      name: 'route_id',
      type: 'uuid',
    })
    routeId: string;
  
    @ManyToOne(() => TransportRoute, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({
      name: 'route_id',
    })
    route: TransportRoute;
  
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
  
    @Column({
      name: 'started_at',
      type: 'date',
    })
    startedAt: string;
  
    @Column({
      name: 'ended_at',
      type: 'date',
      nullable: true,
    })
    endedAt: string | null;
  
    @Column({
      type: 'enum',
      enum: RouteDriverAssignmentStatus,
      default: RouteDriverAssignmentStatus.ACTIVE,
    })
    status: RouteDriverAssignmentStatus;
  
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