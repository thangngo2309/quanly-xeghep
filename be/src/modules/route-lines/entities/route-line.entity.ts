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
  import { TransportRoute } from '../../routes/entities/route.entity';
import { RouteLineStatus } from 'src/enums/route-line-status.enum';
  
  @Entity('route_lines')
  @Index('UQ_route_lines_company_name', ['companyId', 'name'], {
    unique: true,
  })
  export class RouteLine {
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
  
    @Column({
      type: 'varchar',
      length: 255,
    })
    name: string;
  
    @Column({
      name: 'start_point',
      type: 'varchar',
      length: 255,
    })
    startPoint: string;
  
    @Column({
      name: 'end_point',
      type: 'varchar',
      length: 255,
    })
    endPoint: string;
  
    @Column({
      name: 'middle_stops',
      type: 'jsonb',
      nullable: true,
    })
    middleStops: string[] | null;
  
    @Column({
      name: 'default_duration_minutes',
      type: 'int',
      nullable: true,
    })
    defaultDurationMinutes: number | null;
  
    @Column({
      name: 'default_turnaround_minutes',
      type: 'int',
      nullable: true,
    })
    defaultTurnaroundMinutes: number | null;
  
    @Column({
      type: 'enum',
      enum: RouteLineStatus,
      default: RouteLineStatus.ACTIVE,
    })
    status: RouteLineStatus;
  
    @Column({
      type: 'text',
      nullable: true,
    })
    note: string | null;
  
    @OneToMany(() => TransportRoute, (route) => route.routeLine)
    routes: TransportRoute[];
  
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