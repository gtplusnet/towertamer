import type { MapData, Tile, TerrainType } from '../types/game.types';
import { mapService } from '../services/map.service';

// Cache for loaded maps to avoid redundant API calls
const mapCache = new Map<string, MapData>();

/**
 * Load and parse map data from API by map ID
 */
export async function loadMap(mapId: string): Promise<MapData> {
  try {
    // Check cache first
    if (mapCache.has(mapId)) {
      return mapCache.get(mapId)!;
    }

    // Fetch from API
    const response = await mapService.getMapById(mapId);

    if (!response.success || !response.data?.map) {
      throw new Error(response.message || 'Failed to load map');
    }

    const mapData = response.data.map;

    // Validate map structure
    validateMapData(mapData);

    // Convert string terrain types to enum
    const tiles: Tile[][] = mapData.tiles.map((row) =>
      row.map((tile) => ({
        terrain: tile.terrain as TerrainType,
        walkable: tile.walkable,
        ...(tile.portalData && { portalData: tile.portalData }),
      }))
    );

    // Update tiles with typed version
    const processedMap: MapData = {
      ...mapData,
      tiles,
    };

    // Cache the processed map
    mapCache.set(mapId, processedMap);

    return processedMap;
  } catch (error) {
    console.error('Error loading map:', error);
    throw error;
  }
}

/**
 * Load the default spawn map
 */
export async function loadDefaultMap(): Promise<MapData> {
  try {
    const response = await mapService.getDefaultMap();

    if (!response.success || !response.data?.map) {
      throw new Error(response.message || 'Failed to load default map');
    }

    const mapData = response.data.map;

    // Validate map structure
    validateMapData(mapData);

    // Convert string terrain types to enum
    const tiles: Tile[][] = mapData.tiles.map((row) =>
      row.map((tile) => ({
        terrain: tile.terrain as TerrainType,
        walkable: tile.walkable,
        ...(tile.portalData && { portalData: tile.portalData }),
      }))
    );

    // Update tiles with typed version
    const processedMap: MapData = {
      ...mapData,
      tiles,
    };

    // Cache the default map
    mapCache.set(mapData._id, processedMap);

    return processedMap;
  } catch (error) {
    console.error('Error loading default map:', error);
    throw error;
  }
}

/**
 * Clear map cache (useful when map is updated)
 */
export function clearMapCache(mapId?: string): void {
  if (mapId) {
    mapCache.delete(mapId);
  } else {
    mapCache.clear();
  }
}

/**
 * Validate map data structure
 */
function validateMapData(data: MapData): void {
  if (!data._id || typeof data._id !== 'string') {
    throw new Error('Invalid map: missing or invalid ID');
  }

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
