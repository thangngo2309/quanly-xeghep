import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { CompanyStatus } from 'src/enums/company.enum';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto) {
    const code = dto.code.trim().toUpperCase();

    const existed = await this.companyRepository.findOne({
      where: { code },
    });

    if (existed) {
      throw new ConflictException('Mã nhà xe đã tồn tại');
    }

    const company = this.companyRepository.create({
      code,
      name: dto.name.trim(),
      phone: dto.phone || null,
      email: dto.email || null,
      taxCode: dto.taxCode || null,
      representativeName: dto.representativeName || null,
      address: dto.address || null,
      status: dto.status || CompanyStatus.ACTIVE,
      note: dto.note || null,
    });

    return this.companyRepository.save(company);
  }

  async findAll(query: ListCompaniesQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;
  
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
  
    const sortColumnMap: Record<string, string> = {
      name: 'company.name',
      code: 'company.code',
      phone: 'company.phone',
      email: 'company.email',
      status: 'company.status',
      createdAt: 'company.createdAt',
      updatedAt: 'company.updatedAt',
    };
  
    const qb = this.companyRepository.createQueryBuilder('company');
  
    if (query.keyword) {
      const keyword = `%${query.keyword}%`;
  
      qb.andWhere(
        `
        (
          company.name ILIKE :keyword
          OR company.code ILIKE :keyword
          OR company.phone ILIKE :keyword
          OR company.email ILIKE :keyword
          OR company.taxCode ILIKE :keyword
          OR company.representativeName ILIKE :keyword
        )
        `,
        { keyword },
      );
    }
  
    if (query.status) {
      qb.andWhere('company.status = :status', {
        status: query.status,
      });
    }
  
    qb.orderBy(
      sortColumnMap[sortBy] || 'company.createdAt',
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .skip(skip)
      .take(limit);
  
    const [items, total] = await qb.getManyAndCount();
  
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Không tìm thấy nhà xe');
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.findOne(id);

    if (dto.code && dto.code.trim().toUpperCase() !== company.code) {
      const code = dto.code.trim().toUpperCase();

      const existed = await this.companyRepository.findOne({
        where: { code },
      });

      if (existed) {
        throw new ConflictException('Mã nhà xe đã tồn tại');
      }

      company.code = code;
    }

    if (dto.name !== undefined) company.name = dto.name.trim();
    if (dto.phone !== undefined) company.phone = dto.phone || null;
    if (dto.email !== undefined) company.email = dto.email || null;
    if (dto.taxCode !== undefined) company.taxCode = dto.taxCode || null;
    if (dto.representativeName !== undefined) {
      company.representativeName = dto.representativeName || null;
    }
    if (dto.address !== undefined) company.address = dto.address || null;
    if (dto.status !== undefined) company.status = dto.status;
    if (dto.note !== undefined) company.note = dto.note || null;

    return this.companyRepository.save(company);
  }

  async remove(id: string) {
    const company = await this.findOne(id);

    await this.companyRepository.remove(company);

    return {
      message: 'Xóa nhà xe thành công',
    };
  }
}