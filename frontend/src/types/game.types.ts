// Legacy pixel-based position (keeping for coordinate conversion)
export interface Position {
  x: number;
  y: number;
}

// Grid-based position for tile system
export interface GridPosition {
  row: number;
  col: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

// Terrain types for tiles
export enum TerrainType {
  GRASS = 'grass',
  WATER = 'water',
  WALL = 'wall',
  TREE = 'tree',
  PORTAL = 'portal',
}

// Portal destination data
export interface PortalData {
  targetMap: string;
  targetPosition: GridPosition;
}

// Individual tile data
export interface Tile {
  terrain: TerrainType;
  walkable: boolean;
  portalData?: PortalData;
}

// Map data structure
export interface MapData {
  name: string;
  width: number;  // columns
  height: number; // rows
  tiles: Tile[][];
}

export interface CharacterState {
  position: GridPosition;  // Now using grid coordinates
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

// Grid-based bounds for map
export interface GameMapBounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}
