import type { MapData, Tile, TerrainType, PortalData, GridPosition } from '../types/game.types';

interface RawTile {
  terrain: string;
  walkable: boolean;
  portalData?: {
    targetMap: string;
    targetPosition: GridPosition;
  };
}

interface RawMapData {
  name: string;
  width: number;
  height: number;
  tiles: Array<Array<RawTile>>;
}

/**
 * Load and parse map data from JSON
 */
export async function loadMap(mapPath: string): Promise<MapData> {
  try {
    const response = await fetch(mapPath);
    if (!response.ok) {
      throw new Error(`Failed to load map: ${response.statusText}`);
    }

    const rawData: RawMapData = await response.json();

    // Validate map structure
    validateMapData(rawData);

    // Convert string terrain types to enum and preserve portal data
    const tiles: Tile[][] = rawData.tiles.map((row) =>
      row.map((tile) => ({
        terrain: tile.terrain as TerrainType,
        walkable: tile.walkable,
        ...(tile.portalData && { portalData: tile.portalData }),
      }))
    );

    return {
      name: rawData.name,
      width: rawData.width,
      height: rawData.height,
      tiles,
    };
  } catch (error) {
    console.error('Error loading map:', error);
    throw error;
  }
}

/**
 * Validate map data structure
 */
function validateMapData(data: RawMapData): void {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid map: missing or invalid name');
  }

  if (!data.width || !data.height || data.width <= 0 || data.height <= 0) {
    throw new Error('Invalid map: invalid dimensions');
  }

  if (!Array.isArray(data.tiles)) {
    throw new Error('Invalid map: tiles must be an array');
  }

  if (data.tiles.length !== data.height) {
    throw new Error(`Invalid map: expected ${data.height} rows, got ${data.tiles.length}`);
  }

  data.tiles.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      throw new Error(`Invalid map: row ${rowIndex} is not an array`);
    }

    if (row.length !== data.width) {
      throw new Error(
        `Invalid map: row ${rowIndex} expected ${data.width} tiles, got ${row.length}`
      );
    }

    row.forEach((tile, colIndex) => {
      if (!tile.terrain || typeof tile.walkable !== 'boolean') {
        throw new Error(
          `Invalid map: tile at [${rowIndex}, ${colIndex}] is missing terrain or walkable property`
        );
      }
    });
  });
}

/**
 * Get a tile at a specific position
 */
export function getTileAt(
  mapData: MapData,
  row: number,
  col: number
): Tile | null {
  if (row < 0 || row >= mapData.height || col < 0 || col >= mapData.width) {
    return null;
  }
  return mapData.tiles[row][col];
}

/**
 * Check if a position is walkable
 */
export function isPositionWalkable(
  mapData: MapData,
  row: number,
  col: number
): boolean {
  const tile = getTileAt(mapData, row, col);
  return tile ? tile.walkable : false;
}
