import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PlayerState } from '../models/PlayerState';
import { User } from '../models/User';
import {
  PlayerMoveData,
  PlayerMapChangeData,
  SocketAuthData,
} from '../types/socket.types';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

export class SocketService {
  private io: SocketIOServer;
  private connectedPlayers: Map<string, SocketAuthData> = new Map();

  // Rate limiting: Track last update time for each player
  private lastUpdateTime: Map<string, number> = new Map();
  private readonly UPDATE_THROTTLE_MS = 100; // Max 10 updates per second

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // JWT authentication middleware for socket connections
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Fetch user data
        const user = await User.findById(decoded.userId);

        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user data to socket
        (socket as any).userId = user._id.toString();
        (socket as any).username = user.username;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        return next(new Error('Authentication failed'));
      }
    });
  }

  // Setup socket event handlers
  private setupEventHandlers(): void {
    this.io.on('connection', async (socket: Socket) => {
      const userId = (socket as any).userId;
      const username = (socket as any).username;

      console.log(`✅ Player connected: ${username} (${userId})`);

      // Store connected player
      this.connectedPlayers.set(socket.id, { userId, username });

      // Handle player joining
      await this.handlePlayerJoin(socket, userId, username);

      // Handle player movement
      socket.on('player:move', (data: PlayerMoveData) => {
        this.handlePlayerMove(socket, userId, username, data);
      });

      // Handle map changes
      socket.on('player:changeMap', (data: PlayerMapChangeData) => {
        this.handlePlayerMapChange(socket, userId, username, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handlePlayerDisconnect(socket, userId, username);
      });
    });
  }

  // Handle player joining the game
  private async handlePlayerJoin(
    socket: Socket,
    userId: string,
    username: string
  ): Promise<void> {
    try {
      // Update player state
      const playerState = await PlayerState.findOneAndUpdate(
        { userId },
        {
          isOnline: true,
          socketId: socket.id,
          lastUpdate: new Date(),
        },
        { new: true }
      );

      if (!playerState) {
        console.error(`Player state not found for user: ${userId}`);
        return;
      }

      // Join room for current map
      socket.join(playerState.currentMap);

      // Send player their current state
      socket.emit('player:state', {
        currentMap: playerState.currentMap,
        position: playerState.position,
        direction: playerState.direction,
      });

      // Get all other online players on the same map
      const otherPlayers = await PlayerState.find({
        currentMap: playerState.currentMap,
        isOnline: true,
        userId: { $ne: userId },
      });

      // Send other players' data to the joining player
      socket.emit(
        'players:list',
        otherPlayers.map((p) => ({
          userId: p.userId.toString(),
          username: p.username,
          position: p.position,
          direction: p.direction,
          currentMap: p.currentMap,
        }))
      );

      // Notify other players on the same map
      socket.to(playerState.currentMap).emit('player:joined', {
        userId,
        username,
        position: playerState.position,
        direction: playerState.direction,
        currentMap: playerState.currentMap,
      });

      console.log(
        `🎮 ${username} joined map: ${playerState.currentMap} at (${playerState.position.row}, ${playerState.position.col})`
      );
    } catch (error) {
      console.error('Error handling player join:', error);
    }
  }

  // Handle player movement
  private async handlePlayerMove(
    socket: Socket,
    userId: string,
    username: string,
    data: PlayerMoveData
  ): Promise<void> {
    try {
      // Throttle updates
      const now = Date.now();
      const lastUpdate = this.lastUpdateTime.get(userId) || 0;

      if (now - lastUpdate < this.UPDATE_THROTTLE_MS) {
        return; // Skip this update
      }

      this.lastUpdateTime.set(userId, now);

      // Update player state in database
      const playerState = await PlayerState.findOneAndUpdate(
        { userId },
        {
          position: data.position,
          direction: data.direction,
          currentMap: data.currentMap,
          lastUpdate: new Date(),
        },
        { new: true }
      );

      if (!playerState) {
        return;
      }

      // Broadcast movement to other players on the same map
      socket.to(data.currentMap).emit('player:moved', {
        userId,
        username,
        position: data.position,
        direction: data.direction,
      });
    } catch (error) {
      console.error('Error handling player move:', error);
    }
  }

  // Handle player changing maps
  private async handlePlayerMapChange(
    socket: Socket,
    userId: string,
    username: string,
    data: PlayerMapChangeData
  ): Promise<void> {
    try {
      // Get current player state to know old map
      const oldPlayerState = await PlayerState.findOne({ userId });

      if (!oldPlayerState) {
        return;
      }

      const oldMap = oldPlayerState.currentMap;

      // Leave old map room
      socket.leave(oldMap);

      // Update player state
      const playerState = await PlayerState.findOneAndUpdate(
        { userId },
        {
          currentMap: data.newMap,
          position: data.newPosition,
          direction: 'idle',
          lastUpdate: new Date(),
        },
        { new: true }
      );

      if (!playerState) {
        return;
      }

      // Join new map room
      socket.join(data.newMap);

      // Notify players on old map that player left
      socket.to(oldMap).emit('player:left', { userId, username });

      // Get all online players on the new map
      const playersOnNewMap = await PlayerState.find({
        currentMap: data.newMap,
        isOnline: true,
        userId: { $ne: userId },
      });

      // Send new map's players to the joining player
      socket.emit(
        'players:list',
        playersOnNewMap.map((p) => ({
          userId: p.userId.toString(),
          username: p.username,
          position: p.position,
          direction: p.direction,
          currentMap: p.currentMap,
        }))
      );

      // Notify players on new map that player joined
      socket.to(data.newMap).emit('player:joined', {
        userId,
        username,
        position: data.newPosition,
        direction: 'idle',
        currentMap: data.newMap,
      });

      console.log(
        `🚪 ${username} moved from ${oldMap} to ${data.newMap} at (${data.newPosition.row}, ${data.newPosition.col})`
      );
    } catch (error) {
      console.error('Error handling player map change:', error);
    }
  }

  // Handle player disconnection
  private async handlePlayerDisconnect(
    socket: Socket,
    userId: string,
    username: string
  ): Promise<void> {
    try {
      // Update player state
      const playerState = await PlayerState.findOneAndUpdate(
        { userId },
        {
          isOnline: false,
          socketId: null,
          lastUpdate: new Date(),
        },
        { new: true }
      );

      if (playerState) {
        // Notify other players on the same map
        socket.to(playerState.currentMap).emit('player:left', {
          userId,
          username,
        });
      }

      // Remove from connected players
      this.connectedPlayers.delete(socket.id);
      this.lastUpdateTime.delete(userId);

      console.log(`❌ Player disconnected: ${username} (${userId})`);
    } catch (error) {
      console.error('Error handling player disconnect:', error);
    }
  }
}
