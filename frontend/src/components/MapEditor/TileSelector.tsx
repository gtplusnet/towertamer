import React from 'react';
import { TerrainType } from '../../types/game.types';
import { TERRAIN_CONFIG } from '../../config/terrainConfig';
import styles from './TileSelector.module.css';

interface TileSelectorProps {
  selectedTerrain: TerrainType;
  onSelectTerrain: (terrain: TerrainType) => void;
}

export const TileSelector: React.FC<TileSelectorProps> = ({
  selectedTerrain,
  onSelectTerrain,
}) => {
  const terrainTypes = Object.values(TerrainType);

  return (
    <div className={styles.container}>
      {terrainTypes.map((terrain) => {
        const config = TERRAIN_CONFIG[terrain];
        const isSelected = selectedTerrain === terrain;

        return (
          <button
            key={terrain}
            className={`${styles.tileButton} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelectTerrain(terrain)}
          >
            <div
              className={styles.tilePreview}
              style={{ backgroundColor: config.color }}
            />
            <div className={styles.tileInfo}>
              <div className={styles.tileName}>{config.name}</div>
              <div className={styles.tileDetails}>
                {config.walkable ? 'Walkable' : 'Not walkable'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
