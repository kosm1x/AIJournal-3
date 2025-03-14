import { User, CreateUserDTO, UserDTO, LoginDTO, AuthResponse } from '@/types';

export interface IUserService {
  createUser(userData: CreateUserDTO): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  login(credentials: LoginDTO): Promise<AuthResponse>;
  validateToken(token: string): Promise<UserDTO>;
}