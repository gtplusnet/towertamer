export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

export interface CharacterState {
  position: Position;
  direction: Direction;
  isMoving: boolean;
  animationFrame: number;
}

export interface SwipeData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
}

export interface GameMapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
