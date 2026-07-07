import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CompanyStatus } from 'src/enums/company.enum';
import { UserStatus } from 'src/enums/user.enums';

const UPLOAD_DOCUMENT_PATH_REGEX = /^\/uploads\/documents\//;

export class CreateOwnerOperatorCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  representativeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  businessRegistrationNumber: string;

  @IsOptional()
  @IsDateString()
  businessRegistrationIssuedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessRegistrationIssuedPlace?: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Vui lòng tải ít nhất một file giấy đăng ký kinh doanh',
  })
  @ArrayMaxSize(10, {
    message: 'Chỉ được tải tối đa 10 file giấy đăng ký kinh doanh',
  })
  @ArrayUnique({
    message: 'Danh sách giấy đăng ký kinh doanh chứa file trùng lặp',
  })
  @IsString({
    each: true,
    message: 'Đường dẫn giấy đăng ký kinh doanh phải là chuỗi',
  })
  @MaxLength(500, {
    each: true,
    message: 'Đường dẫn file giấy đăng ký kinh doanh quá dài',
  })
  @Matches(UPLOAD_DOCUMENT_PATH_REGEX, {
    each: true,
    message:
      'Đường dẫn giấy đăng ký kinh doanh phải bắt đầu bằng /uploads/documents/',
  })
  businessRegistrationDocuments: string[];

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class CreateOwnerOperatorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Vui lòng tải ít nhất một file giấy phép lái xe',
  })
  @ArrayMaxSize(6, {
    message: 'Chỉ được tải tối đa 6 file giấy phép lái xe',
  })
  @ArrayUnique({
    message: 'Danh sách giấy phép lái xe chứa file trùng lặp',
  })
  @IsString({
    each: true,
    message: 'Đường dẫn giấy phép lái xe phải là chuỗi',
  })
  @MaxLength(500, {
    each: true,
    message: 'Đường dẫn file giấy phép lái xe quá dài',
  })
  @Matches(UPLOAD_DOCUMENT_PATH_REGEX, {
    each: true,
    message: 'Đường dẫn giấy phép lái xe phải bắt đầu bằng /uploads/documents/',
  })
  driverLicenseDocuments: string[];

  @IsDefined({
    message: 'Vui lòng nhập thông tin đơn vị kinh doanh',
  })
  @ValidateNested()
  @Type(() => CreateOwnerOperatorCompanyDto)
  company: CreateOwnerOperatorCompanyDto;
}
