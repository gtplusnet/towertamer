import type { MapData, Position } from '../../types/game.types';
import type { TileSize } from '../../utils/coordinateUtils';
import { getTerrainProperties } from '../../config/terrainConfig';
import styles from './GameMap.module.css';

const API_BASE_URL = 'http://100.121.246.85:4025';

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
  // Construct background image URL if map has a background
  const backgroundImageUrl = mapData.backgroundImage
    ? `${API_BASE_URL}${mapData.backgroundImage}`
    : undefined;

  return (
    <div className={styles.gameMap} data-testid="game-map">
      <div
        className={styles.mapContainer}
        data-testid="map-container"
        style={{
          transform: `translate(${-cameraOffset.x}px, ${-cameraOffset.y}px)`,
        }}
      >
        <div className={styles.grid}>
          {/* Background image layer (behind tiles) */}
          {backgroundImageUrl && (
            <div
              className={styles.backgroundLayer}
              style={{
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'top left',
                backgroundRepeat: 'no-repeat',
                width: `${mapData.width * tileSize.width}px`,
                height: `${mapData.height * tileSize.height}px`,
              }}
            />
          )}
          {/* Render terrain tiles from map data with absolute positioning */}
          {mapData.tiles.map((row, rowIndex) =>
            row.map((tile, colIndex) => {
              const terrainProps = getTerrainProperties(tile.terrain);
              // Make none, barrier, and portals transparent when map has background image
              const shouldBeTransparent = mapData.backgroundImage &&
                (tile.terrain === 'none' || tile.terrain === 'barrier' || tile.terrain === 'portal');
              const tileColor = shouldBeTransparent ? 'transparent' : terrainProps.color;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={styles.tile}
                  style={{
                    backgroundColor: tileColor,
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
