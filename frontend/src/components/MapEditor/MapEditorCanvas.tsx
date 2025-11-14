import React, { useState, useRef, useCallback } from 'react';
import type { MapData, Tile, TerrainType } from '../../types/game.types';
import { getTerrainProperties } from '../../config/terrainConfig';
import styles from './MapEditorCanvas.module.css';

interface MapEditorCanvasProps {
  mapData: MapData;
  selectedTerrain: TerrainType;
  onTileChange: (row: number, col: number, tile: Tile) => void;
  tileSize?: number;
}

export const MapEditorCanvas: React.FC<MapEditorCanvasProps> = ({
  mapData,
  selectedTerrain,
  onTileChange,
  tileSize = 24,
}) => {
  const [isPainting, setIsPainting] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle mouse down - start painting
  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      setIsPainting(true);
      paintTile(row, col);
    },
    [selectedTerrain]
  );

  // Handle mouse up - stop painting
  const handleMouseUp = useCallback(() => {
    setIsPainting(false);
  }, []);

  // Handle mouse enter on tile - paint if mouse is down
  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      setHoveredTile({ row, col });

      if (isPainting) {
        paintTile(row, col);
      }
    },
    [isPainting, selectedTerrain]
  );

  // Paint a tile with the selected terrain
  const paintTile = (row: number, col: number) => {
    const terrainProps = getTerrainProperties(selectedTerrain);

    onTileChange(row, col, {
      terrain: selectedTerrain,
      walkable: terrainProps.walkable,
    });
  };

  // Handle mouse leave canvas - stop painting
  const handleMouseLeave = () => {
    setIsPainting(false);
    setHoveredTile(null);
  };

  return (
    <div
      className={styles.canvas}
      ref={canvasRef}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${mapData.width}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${mapData.height}, ${tileSize}px)`,
        }}
      >
        {mapData.tiles.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const terrainProps = getTerrainProperties(tile.terrain);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={styles.tile}
                style={{
                  backgroundColor: terrainProps.color,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                }}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                title={`[${rowIndex}, ${colIndex}] ${terrainProps.name}`}
              />
            );
          })
        )}
      </div>

      {hoveredTile && (
        <div className={styles.coordinates}>
          Row: {hoveredTile.row}, Col: {hoveredTile.col}
        </div>
      )}
    </div>
  );
};
