import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Max,
    Min,
  } from 'class-validator';
  import { Type } from 'class-transformer';
import { RouteDirection } from 'src/enums/route-line.enum';
  
  export class CreatePublicBookingDto {
    @IsUUID()
    companyId: string;
  
    @IsUUID()
    routeLineId: string;
  
    @IsEnum(RouteDirection)
    direction: RouteDirection;
  
    @IsDateString()
    travelDate: string;
  
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    preferredTime: string;
  
    @IsString()
    @IsNotEmpty()
    customerName: string;
  
    @IsString()
    @IsNotEmpty()
    customerPhone: string;
  
    @IsOptional()
    @IsEmail()
    customerEmail?: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(99)
    passengerCount?: number;
  
    @IsString()
    @IsNotEmpty()
    pickupAddress: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsLatitude()
    pickupLat?: number;
  
    @IsOptional()
    @Type(() => Number)
    @IsLongitude()
    pickupLng?: number;
  
    @IsOptional()
    @IsString()
    dropoffAddress?: string;
  
    @IsOptional()
    @IsString()
    pickupNote?: string;
  
    @IsOptional()
    @IsString()
    dropoffNote?: string;
  
    @IsOptional()
    @IsString()
    note?: string;
  }