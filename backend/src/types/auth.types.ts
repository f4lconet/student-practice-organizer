export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: string;
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  verifiedAt?: Date | null;
  createdAt: Date;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}