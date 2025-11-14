export interface GridPosition {
  row: number;
  col: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

export interface PlayerMoveData {
  position: GridPosition;
  direction: Direction;
  currentMap: string;
}

export interface PlayerMapChangeData {
  newMap: string;
  newPosition: GridPosition;
}

export interface PlayerData {
  userId: string;
  username: string;
  position: GridPosition;
  direction: Direction;
  currentMap: string;
  socketId: string;
}

export interface SocketAuthData {
  userId: string;
  username: string;
}
