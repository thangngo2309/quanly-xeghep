import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CompanyStatus } from 'src/enums/company-status.enum';

export class CreateCompanyDto {
  @ApiProperty({ example: 'NHAXE001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Nhà xe An Phú' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@nhaxe.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0401234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  representativeName?: string;

  @ApiPropertyOptional({ example: 'Đà Nẵng' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    enum: CompanyStatus,
    example: CompanyStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}