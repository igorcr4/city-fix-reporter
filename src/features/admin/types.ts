import type { UserRole } from "@/shared/types";

export interface AdminUserMunicipality {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  municipality?: AdminUserMunicipality | null;
}

export interface PromoteMunicipalAdminPayload {
  country: string;
  state: string;
  city: string;
}
