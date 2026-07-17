import { User } from '../generated/prisma/client.js';

export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  passwordHash: string;
}