import type { GridPosition, Position } from '../types/game.types';

export interface TileSize {
  width: number;
  height: number;
}

/**
 * Calculate tile dimensions - now returns fixed size for consistency
 * All maps use the same tile size regardless of dimensions
 */
export function calculateTileSize(
  viewportWidth: number,
  viewportHeight: number,
  mapWidth: number,
  mapHeight: number
): TileSize {
  // Fixed tile size - character is 48x48, so tiles should be similar size
  const TILE_SIZE = 48;

  return {
    width: TILE_SIZE,
    height: TILE_SIZE,
  };
}

/**
 * Convert grid position to pixel coordinates
 * Returns the CENTER of the tile for character positioning
 */
export function gridToPixel(
  gridPos: GridPosition,
  tileSize: TileSize
): Position {
  return {
    x: gridPos.col * tileSize.width + tileSize.width / 2,
    y: gridPos.row * tileSize.height + tileSize.height / 2,
  };
}

/**
 * Convert pixel coordinates to grid position
 * Useful for click/touch position detection
 */
export function pixelToGrid(
  pixelPos: Position,
  tileSize: TileSize
): GridPosition {
  return {
    row: Math.floor(pixelPos.y / tileSize.height),
    col: Math.floor(pixelPos.x / tileSize.width),
  };
}

/**
 * Check if a grid position is within map bounds
 */
export function isWithinBounds(
  pos: GridPosition,
  mapWidth: number,
  mapHeight: number
): boolean {
  return pos.row >= 0 && pos.row < mapHeight && pos.col >= 0 && pos.col < mapWidth;
}

/**
 * Get the next grid position based on direction
 */
export function getNextPosition(
  current: GridPosition,
  direction: 'up' | 'down' | 'left' | 'right'
): GridPosition {
  switch (direction) {
    case 'up':
      return { row: current.row - 1, col: current.col };
    case 'down':
      return { row: current.row + 1, col: current.col };
    case 'left':
      return { row: current.row, col: current.col - 1 };
    case 'right':
      return { row: current.row, col: current.col + 1 };
    default:
      return current;
  }
}
