import { TerrainType } from '../types/game.types';

export interface TerrainProperties {
  color: string;
  walkable: boolean;
  name: string;
}

export const TERRAIN_CONFIG: Record<TerrainType, TerrainProperties> = {
  [TerrainType.NONE]: {
    color: '#3a3a3a',  // Dark grey - walkable
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
  [TerrainType.BARRIER]: {
    color: '#cc0000',  // Red - non-walkable barrier
    walkable: false,
    name: 'Barrier',
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
