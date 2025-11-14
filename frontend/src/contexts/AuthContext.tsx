import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type {
  User,
  PlayerState,
  RegisterData,
  LoginData,
  AuthResponse,
} from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  playerState: PlayerState | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  updatePlayerState: (playerState: PlayerState) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const response = await authService.getCurrentUser();

        if (response?.success && response.data) {
          setUser(response.data.user);
          setPlayerState(response.data.playerState);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData): Promise<AuthResponse> => {
    const response = await authService.login(data);

    if (response.success && response.data) {
      setUser(response.data.user);
      setPlayerState(response.data.playerState);
    }

    return response;
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authService.register(data);

    if (response.success && response.data) {
      setUser(response.data.user);
      setPlayerState(response.data.playerState);
    }

    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setPlayerState(null);
  };

  const updatePlayerState = (newPlayerState: PlayerState) => {
    setPlayerState(newPlayerState);
  };

  const value: AuthContextType = {
    user,
    playerState,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    updatePlayerState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
