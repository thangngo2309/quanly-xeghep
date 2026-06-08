export type AuthUser = {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    role: string;
    status: string;
    companyId?: string | null;
  };
  
  export type SigninPayload = {
    identifier: string;
    password: string;
  };
  
  export type RefreshTokenPayload = {
    refreshToken: string;
  };
  
  export type AuthResponse = {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
  
  export type JwtPayload = {
    sub: string;
    phone: string;
    role: string;
    exp?: number;
    iat?: number;
  };