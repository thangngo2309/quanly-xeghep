import { UserRole } from "src/enums/user.enums";

export type JwtPayload = {
  sub: string;
  phone: string;
  role: UserRole;
  companyId: string | null;
};