import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CompanyStatus } from 'src/enums/company.enum';

const UPLOAD_DOCUMENT_PATH_REGEX = /^\/uploads\/documents\//;

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
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
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRegistrationNumber?: string;

  @IsOptional()
  @IsDateString()
  businessRegistrationIssuedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessRegistrationIssuedPlace?: string;

  @IsOptional()
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
  @Matches(UPLOAD_DOCUMENT_PATH_REGEX, {
    each: true,
    message:
      'Đường dẫn giấy đăng ký kinh doanh phải bắt đầu bằng /uploads/documents/',
  })
  businessRegistrationDocuments?: string[];
}
