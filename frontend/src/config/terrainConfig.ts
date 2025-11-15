import { TerrainType } from '../types/game.types';

export interface TerrainProperties {
  color: string;
  walkable: boolean;
  name: string;
}

export const TERRAIN_CONFIG: Record<TerrainType, TerrainProperties> = {
  [TerrainType.NONE]: {
    color: 'transparent',  // Shows background image
    walkable: true,
    name: 'None',
  },
  [TerrainType.GRASS]: {
    color: '#4a7c2f',
    walkable: true,
    name: 'Grass (Legacy)',
  },
  [TerrainType.WATER]: {
    color: '#2e5c8a',
    walkable: false,
    name: 'Water',
  },
  [TerrainType.WALL]: {
    color: '#6b6b6b',
    walkable: false,
    name: 'Wall',
  },
  [TerrainType.TREE]: {
    color: '#2d5016',
    walkable: false,
    name: 'Tree',
  },
  [TerrainType.PORTAL]: {
    color: '#9b59b6',
    walkable: true,
    name: 'Portal',
  },
};

// Helper function to get terrain properties
export function getTerrainProperties(terrain: TerrainType): TerrainProperties {
  return TERRAIN_CONFIG[terrain];
}

// Helper function to check if terrain is walkable
export function isTerrainWalkable(terrain: TerrainType): boolean {
  return TERRAIN_CONFIG[terrain].walkable;
}
