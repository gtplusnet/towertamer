import type { MapData, Position } from '../../types/game.types';
import type { TileSize } from '../../utils/coordinateUtils';
import { getTerrainProperties } from '../../config/terrainConfig';
import styles from './GameMap.module.css';

interface GameMapProps {
  mapData: MapData;
  cameraOffset?: Position;  // Camera offset for centering character
  tileSize: TileSize;  // Explicit tile size for perfect alignment
  children?: React.ReactNode;  // Allow rendering character inside map
}

export const GameMap: React.FC<GameMapProps> = ({
  mapData,
  cameraOffset = { x: 0, y: 0 },
  tileSize,
  children
}) => {
  return (
    <div className={styles.gameMap} data-testid="game-map">
      <div
        className={styles.mapContainer}
        style={{
          transform: `translate(${-cameraOffset.x}px, ${-cameraOffset.y}px)`,
        }}
      >
        <div className={styles.grid}>
          {/* Render terrain tiles from map data with absolute positioning */}
          {mapData.tiles.map((row, rowIndex) =>
            row.map((tile, colIndex) => {
              const terrainProps = getTerrainProperties(tile.terrain);
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={styles.tile}
                  style={{
                    backgroundColor: terrainProps.color,
                    width: `${tileSize.width}px`,
                    height: `${tileSize.height}px`,
                    left: `${colIndex * tileSize.width}px`,
                    top: `${rowIndex * tileSize.height}px`,
                  }}
                  data-terrain={tile.terrain}
                  data-walkable={tile.walkable}
                />
              );
            })
          )}
        </div>
        {/* Render character inside map container so it moves with the map */}
        {children}
      </div>
    </div>
  );
};
