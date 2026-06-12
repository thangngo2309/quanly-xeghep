import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSettingDto } from './dto/create-setting.dto';
import { ListSettingsQueryDto } from './dto/list-settings-query.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entities/setting.entity';
import { SettingGroup, SettingStatus, SettingValueType } from 'src/enums/setting.enum';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private validateValueByType(value: string | undefined, type: SettingValueType) {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (type === SettingValueType.NUMBER) {
      const numberValue = Number(value);

      if (Number.isNaN(numberValue)) {
        throw new BadRequestException('Giá trị cấu hình phải là số');
      }
    }

    if (type === SettingValueType.BOOLEAN) {
      if (!['true', 'false'].includes(value.toLowerCase())) {
        throw new BadRequestException(
          'Giá trị boolean chỉ được nhập true hoặc false',
        );
      }
    }

    if (type === SettingValueType.JSON) {
      try {
        JSON.parse(value);
      } catch {
        throw new BadRequestException('Giá trị JSON không hợp lệ');
      }
    }
  }

  private parseValue(setting: Setting) {
    if (setting.value === null || setting.value === undefined) {
      return null;
    }

    switch (setting.valueType) {
      case SettingValueType.NUMBER:
        return Number(setting.value);

      case SettingValueType.BOOLEAN:
        return setting.value.toLowerCase() === 'true';

      case SettingValueType.JSON:
        try {
          return JSON.parse(setting.value);
        } catch {
          return setting.value;
        }

      default:
        return setting.value;
    }
  }

  private toResponse(setting: Setting) {
    return {
      ...setting,
      parsedValue: this.parseValue(setting),
    };
  }

  async create(dto: CreateSettingDto) {
    const code = this.normalizeCode(dto.code);
    const valueType = dto.valueType || SettingValueType.STRING;

    this.validateValueByType(dto.value, valueType);

    const existed = await this.settingRepository.findOne({
      where: {
        code,
      },
    });

    if (existed) {
      throw new ConflictException('Mã cấu hình đã tồn tại');
    }

    const setting = this.settingRepository.create({
      code,
      name: dto.name.trim(),
      group: dto.group || SettingGroup.OTHER,
      valueType,
      value: dto.value ?? null,
      description: dto.description || null,
      status: dto.status || SettingStatus.ACTIVE,
    });

    const savedSetting = await this.settingRepository.save(setting);

    return this.toResponse(savedSetting);
  }

  async findAll(query: ListSettingsQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const sortColumnMap: Record<string, string> = {
      code: 'setting.code',
      name: 'setting.name',
      group: 'setting.group',
      valueType: 'setting.value_type',
      status: 'setting.status',
      createdAt: 'setting.created_at',
      updatedAt: 'setting.updated_at',
    };

    const qb = this.settingRepository.createQueryBuilder('setting');

    if (query.keyword) {
      const keyword = `%${query.keyword}%`;

      qb.andWhere(
        `
        (
          setting.code ILIKE :keyword
          OR setting.name ILIKE :keyword
          OR setting.description ILIKE :keyword
        )
        `,
        {
          keyword,
        },
      );
    }

    if (query.group) {
      qb.andWhere('setting.group = :group', {
        group: query.group,
      });
    }

    if (query.valueType) {
      qb.andWhere('setting.value_type = :valueType', {
        valueType: query.valueType,
      });
    }

    if (query.status) {
      qb.andWhere('setting.status = :status', {
        status: query.status,
      });
    }

    qb.orderBy(
      sortColumnMap[sortBy] || 'setting.created_at',
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const setting = await this.settingRepository.findOne({
      where: {
        id,
      },
    });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cấu hình');
    }

    return this.toResponse(setting);
  }

  async findByCode(code: string) {
    const setting = await this.settingRepository.findOne({
      where: {
        code: this.normalizeCode(code),
        status: SettingStatus.ACTIVE,
      },
    });

    if (!setting) {
      return null;
    }

    return this.toResponse(setting);
  }

  async update(id: string, dto: UpdateSettingDto) {
    const setting = await this.settingRepository.findOne({
      where: {
        id,
      },
    });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cấu hình');
    }

    if (dto.code !== undefined) {
      const nextCode = this.normalizeCode(dto.code);

      if (nextCode !== setting.code) {
        const existed = await this.settingRepository.findOne({
          where: {
            code: nextCode,
          },
        });

        if (existed) {
          throw new ConflictException('Mã cấu hình đã tồn tại');
        }

        setting.code = nextCode;
      }
    }

    const nextValueType = dto.valueType || setting.valueType;

    if (dto.value !== undefined || dto.valueType !== undefined) {
      this.validateValueByType(dto.value ?? setting.value ?? undefined, nextValueType);
    }

    if (dto.name !== undefined) {
      setting.name = dto.name.trim();
    }

    if (dto.group !== undefined) {
      setting.group = dto.group;
    }

    if (dto.valueType !== undefined) {
      setting.valueType = dto.valueType;
    }

    if (dto.value !== undefined) {
      setting.value = dto.value || null;
    }

    if (dto.description !== undefined) {
      setting.description = dto.description || null;
    }

    if (dto.status !== undefined) {
      setting.status = dto.status;
    }

    const savedSetting = await this.settingRepository.save(setting);

    return this.toResponse(savedSetting);
  }

  async remove(id: string) {
    const setting = await this.settingRepository.findOne({
      where: {
        id,
      },
    });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cấu hình');
    }

    await this.settingRepository.remove(setting);

    return {
      message: 'Xóa cấu hình thành công',
    };
  }
}