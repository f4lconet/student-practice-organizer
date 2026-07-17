export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export type UserRole = "PRACTICANT" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}