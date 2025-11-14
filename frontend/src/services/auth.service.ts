import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://100.121.246.85:4025/api';
const TOKEN_KEY = 'towertamer_token';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  login: string; // username or email
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isDeveloper: boolean;
}

export interface PlayerState {
  currentMap: string;
  position: {
    row: number;
    col: number;
  };
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  isOnline?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
    playerState: PlayerState;
  };
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Set token
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Clear token
  private clearToken(): void {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, data);

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, data);

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Token expired or invalid
        if (axiosError.response?.status === 401) {
          this.clearToken();
        }
      }

      return null;
    }
  }

  // Logout
  logout(): void {
    this.clearToken();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export const authService = new AuthService();
