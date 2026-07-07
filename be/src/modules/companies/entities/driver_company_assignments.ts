import { DriverCompanyRelationType } from "src/enums/company.enum";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('driver_company_assignments')
export class DriverCompanyAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  driverId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({
    name: 'relation_type',
    type: 'enum',
    enum: DriverCompanyRelationType,
  })
  relationType: DriverCompanyRelationType;

  @Column({ name: 'active_from', type: 'date' })
  activeFrom: string;

  @Column({ name: 'active_to', type: 'date', nullable: true })
  activeTo: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}