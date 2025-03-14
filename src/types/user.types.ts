import { ObjectId } from 'mongodb';

export interface UserPreferences {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
}

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  preferences?: Partial<UserPreferences>;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}