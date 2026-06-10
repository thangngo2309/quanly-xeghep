import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleStatus, VehicleType } from 'src/enums/vehicle-type.enum';

export class CreateVehicleDto {
  @ApiPropertyOptional({
    example: 'uuid-company-id',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({
    example: '43A-12345',
  })
  @IsString()
  @MaxLength(30)
  licensePlate: string;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.SEVEN_SEAT,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({
    example: 'Toyota',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({
    example: 'Innova',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({
    example: 'Trắng',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({
    example: 2024,
  })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  productionYear?: number;

  @ApiPropertyOptional({
    example: '2027-12-31',
  })
  @IsOptional()
  @IsDateString()
  registrationExpiryDate?: string;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    example: VehicleStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}