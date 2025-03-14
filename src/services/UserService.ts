import { Service } from 'typedi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, CreateUserDTO, UserDTO, LoginDTO, AuthResponse } from '@/types';
import { IUserService } from './interfaces/IUserService';
import { UserModel } from '@/models/User';
import { AppError, ErrorType } from '@/utils/errors';
import { logger } from '@/utils/logger';

@Service()
export class UserService implements IUserService {
  async createUser(userData: CreateUserDTO): Promise<User> {
    try {
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError(ErrorType.Conflict, 'Email already registered');
      }

      const user = new UserModel({
        ...userData,
        preferences: {
          theme: 'light',
          emailNotifications: true,
          ...userData.preferences
        }
      });

      await user.save();
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      return await UserModel.findById(id);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await UserModel.findOne({ email });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: new Date() },
        { new: true }
      );

      if (!user) {
        throw new AppError(ErrorType.NotFound, 'User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async login(credentials: LoginDTO): Promise<AuthResponse> {
    try {
      const user = await UserModel.findOne({ email: credentials.email });
      if (!user) {
        throw new AppError(ErrorType.Unauthorized, 'Invalid credentials');
      }

      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        throw new AppError(ErrorType.Unauthorized, 'Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: this.toDTO(user)
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<UserDTO> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await this.findUserById(decoded.userId);

      if (!user) {
        throw new AppError(ErrorType.Unauthorized, 'Invalid token');
      }

      return this.toDTO(user);
    } catch (error) {
      logger.error('Error validating token:', error);
      throw new AppError(ErrorType.Unauthorized, 'Invalid token');
    }
  }

  private toDTO(user: User): UserDTO {
    return {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      preferences: user.preferences
    };
  }
}