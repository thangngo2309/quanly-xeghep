import { SettingGroup, SettingStatus, SettingValueType } from 'src/enums/setting-status.enum';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('settings')
  export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index({ unique: true })
    @Column({
      type: 'varchar',
      length: 100,
    })
    code: string;
  
    @Column({
      type: 'varchar',
      length: 255,
    })
    name: string;
  
    @Column({
      type: 'enum',
      enum: SettingGroup,
      default: SettingGroup.OTHER,
    })
    group: SettingGroup;
  
    @Column({
      name: 'value_type',
      type: 'enum',
      enum: SettingValueType,
      default: SettingValueType.STRING,
    })
    valueType: SettingValueType;
  
    @Column({
      type: 'text',
      nullable: true,
    })
    value: string | null;
  
    @Column({
      type: 'text',
      nullable: true,
    })
    description: string | null;
  
    @Column({
      type: 'enum',
      enum: SettingStatus,
      default: SettingStatus.ACTIVE,
    })
    status: SettingStatus;
  
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