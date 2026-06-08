import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import type { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existedPhone = await this.usersService.findByPhone(dto.phone);

    if (existedPhone) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    if (dto.email) {
      const existedEmail = await this.usersService.findByEmail(dto.email);

      if (existedEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createByAuth({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email || null,
      passwordHash,
      role: UserRole.ADMIN,
    });

    const tokens = await this.generateTokens(user);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const safeUser = await this.usersService.findByIdOrFail(user.id);

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async signin(dto: SigninDto) {
    const user = await this.usersService.findByIdentifierWithPassword(
      dto.identifier,
    );

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không đúng');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản không hoạt động');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không đúng');
    }

    const tokens = await this.generateTokens(user);

    await this.saveRefreshToken(user.id, tokens.refreshToken);
    await this.usersService.updateLastLoginAt(user.id);

    const safeUser = await this.usersService.findByIdOrFail(user.id);

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            this.configService.get<string>('JWT_SECRET') ||
            'change_me_refresh_secret_key',
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản không hoạt động');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const tokens = await this.generateTokens(user);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const safeUser = await this.usersService.findByIdOrFail(user.id);

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async signout(userId: string) {
    await this.usersService.updateRefreshTokenHash(userId, null);

    return {
      message: 'Đăng xuất thành công',
    };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      companyId: user.companyId || null,
    };
  
    const accessSecret =
      this.configService.get<string>('JWT_SECRET') || 'change_me_secret_key';
  
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'change_me_refresh_secret_key';
  
    const accessExpiresIn = (
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m'
    ) as JwtSignOptions['expiresIn'];
  
    const refreshExpiresIn = (
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d'
    ) as JwtSignOptions['expiresIn'];
  
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });
  
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });
  
    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);
  }
}
