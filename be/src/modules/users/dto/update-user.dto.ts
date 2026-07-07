import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateOwnerOperatorCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  representativeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRegistrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  businessRegistrationIssuedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessRegistrationIssuedPlace?: string;

  @ApiPropertyOptional({
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Vui lòng tải giấy đăng ký kinh doanh',
  })
  @ArrayMaxSize(10, {
    message: 'Chỉ được tải tối đa 10 file giấy đăng ký kinh doanh',
  })
  @IsString({
    each: true,
  })
  @Matches(/^\/uploads\/documents\//, {
    each: true,
    message: 'Đường dẫn file đăng ký kinh doanh không hợp lệ',
  })
  businessRegistrationDocuments?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    type: UpdateOwnerOperatorCompanyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOwnerOperatorCompanyDto)
  ownerCompany?: UpdateOwnerOperatorCompanyDto;
}
