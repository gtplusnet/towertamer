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
export const TerrainType = {
  GRASS: 'grass',
  WATER: 'water',
  WALL: 'wall',
  TREE: 'tree',
  PORTAL: 'portal',
} as const;

export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType];

// Portal destination data
export interface PortalData {
  targetMapId: string; // ObjectId reference to target map
  targetPosition: GridPosition;
}

// Individual tile data
export interface Tile {
  terrain: TerrainType;
  walkable: boolean;
  portalData?: PortalData;
}

// Map data structure (from database)
export interface MapData {
  _id: string; // MongoDB ObjectId
  name: string;
  slug: string;
  width: number;  // columns
  height: number; // rows
  tiles: Tile[][];
  isPublished: boolean;
  isDefaultSpawn: boolean;
  createdBy: string | null; // User ObjectId or null
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Map list item (without tiles for performance)
export interface MapListItem {
  _id: string;
  name: string;
  slug: string;
  width: number;
  height: number;
  isPublished: boolean;
  isDefaultSpawn: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
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
