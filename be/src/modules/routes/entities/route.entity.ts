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
import { TransportRouteStatus } from 'src/enums/transport-route-status.enum';
import { RouteDirection } from 'src/enums/route-direction.enum';
import { RouteLine } from 'src/modules/route-lines/entities/route-line.entity';

@Entity('transport_routes')
@Index('IDX_transport_routes_company_name', ['companyId', 'name'])
export class TransportRoute {
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
    type: 'varchar',
    length: 255,
  })
  origin: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  destination: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  stops: string[] | null;

  @Column({
    name: 'distance_km',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  distanceKm: string | null;

  @Column({
    name: 'estimated_duration_minutes',
    type: 'int',
    nullable: true,
  })
  estimatedDurationMinutes: number | null;

  @Column({
    type: 'enum',
    enum: TransportRouteStatus,
    default: TransportRouteStatus.ACTIVE,
  })
  status: TransportRouteStatus;

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

  @Index()
  @Column({
    name: 'route_line_id',
    type: 'uuid',
    nullable: true,
  })
  routeLineId: string | null;

  @ManyToOne(() => RouteLine, (routeLine) => routeLine.routes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'route_line_id',
  })
  routeLine: RouteLine | null;

  @Column({
    type: 'enum',
    enum: RouteDirection,
    nullable: true,
  })
  direction: RouteDirection | null;

  @Column({
    name: 'opposite_route_id',
    type: 'uuid',
    nullable: true,
  })
  oppositeRouteId: string | null;

  @ManyToOne(() => TransportRoute, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'opposite_route_id',
  })
  oppositeRoute: TransportRoute | null;
}
