import { io, Socket } from 'socket.io-client';
import { authService } from './auth.service';
import type { GridPosition, Direction } from '../types/game.types';

const SOCKET_URL = 'http://100.121.246.85:4025';

export interface OtherPlayerData {
  userId: string;
  username: string;
  position: GridPosition;
  direction: Direction;
  currentMap: string;
}

export interface PlayerMoveData {
  userId: string;
  username: string;
  position: GridPosition;
  direction: Direction;
}

export interface PlayerLeftData {
  userId: string;
  username: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  // Connect to socket server
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = authService.getToken();

    if (!token) {
      console.error('No auth token found, cannot connect socket');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.setupInternalListeners();
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Setup internal socket event listeners
  private setupInternalListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Forward all socket events to registered listeners
    this.socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args);
    });
  }

  // Emit event to socket server
  send(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  // Register event listener
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
  }

  // Unregister event listener
  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);

    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Emit event to all registered listeners
  private emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);

    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in listener for event "${event}":`, error);
        }
      });
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Player movement events
  emitPlayerMove(data: { position: GridPosition; direction: Direction; currentMap: string }): void {
    this.send('player:move', data);
  }

  emitPlayerMapChange(data: { newMap: string; newPosition: GridPosition }): void {
    this.send('player:changeMap', data);
  }

  // Listen for player events
  onPlayerJoined(callback: (player: OtherPlayerData) => void): void {
    this.on('player:joined', callback);
  }

  onPlayerMoved(callback: (data: PlayerMoveData) => void): void {
    this.on('player:moved', callback);
  }

  onPlayerLeft(callback: (data: PlayerLeftData) => void): void {
    this.on('player:left', callback);
  }

  onPlayersList(callback: (players: OtherPlayerData[]) => void): void {
    this.on('players:list', callback);
  }

  onPlayerState(callback: (state: any) => void): void {
    this.on('player:state', callback);
  }
}

export const socketService = new SocketService();
