import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { MapData, Tile, TerrainType } from '../../types/game.types';
import { getTerrainProperties } from '../../config/terrainConfig';
import styles from './MapEditorCanvas.module.css';

interface MapEditorCanvasProps {
  mapData: MapData;
  selectedTerrain: TerrainType;
  onTileChange: (row: number, col: number, tile: Tile) => void;
  tileSize?: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const MapEditorCanvas: React.FC<MapEditorCanvasProps> = ({
  mapData,
  selectedTerrain,
  onTileChange,
  tileSize = 24,
  zoom = 1,
  onZoomChange,
}) => {
  const [isPainting, setIsPainting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [scrollStart, setScrollStart] = useState<{ left: number; top: number } | null>(null);

  // Calculate effective tile size with zoom
  const effectiveTileSize = tileSize * zoom;

  // Calculate viewport bounds for virtualization
  const [viewportBounds, setViewportBounds] = useState({
    startRow: 0,
    endRow: mapData.height,
    startCol: 0,
    endCol: mapData.width,
  });

  // Buffer zone (tiles to render outside viewport)
  const BUFFER = 20;

  // Update viewport bounds on scroll or zoom change
  const updateViewportBounds = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Calculate visible tile range
    const startRow = Math.max(0, Math.floor(scrollTop / effectiveTileSize) - BUFFER);
    const endRow = Math.min(
      mapData.height,
      Math.ceil((scrollTop + viewportHeight) / effectiveTileSize) + BUFFER
    );
    const startCol = Math.max(0, Math.floor(scrollLeft / effectiveTileSize) - BUFFER);
    const endCol = Math.min(
      mapData.width,
      Math.ceil((scrollLeft + viewportWidth) / effectiveTileSize) + BUFFER
    );

    setViewportBounds({ startRow, endRow, startCol, endCol });
  }, [mapData.width, mapData.height, effectiveTileSize]);

  // Update bounds on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateViewportBounds();
    };

    container.addEventListener('scroll', handleScroll);
    updateViewportBounds(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateViewportBounds]);

  // Update bounds when zoom changes
  useEffect(() => {
    updateViewportBounds();
  }, [zoom, updateViewportBounds]);

  // Center viewport on initial load
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const canvasWidth = mapData.width * effectiveTileSize;
    const canvasHeight = mapData.height * effectiveTileSize;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Center the map in the viewport
    const scrollLeft = Math.max(0, (canvasWidth - viewportWidth) / 2);
    const scrollTop = Math.max(0, (canvasHeight - viewportHeight) / 2);

    container.scrollLeft = scrollLeft;
    container.scrollTop = scrollTop;

    // Update viewport bounds after centering
    updateViewportBounds();
  }, [mapData._id, effectiveTileSize]); // Re-center when map changes or zoom changes

  // Handle keyboard events for spacebar pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const newZoom = Math.max(0.25, Math.min(2, zoom + delta));

        if (onZoomChange && newZoom !== zoom) {
          onZoomChange(newZoom);
        }
      }
    },
    [zoom, onZoomChange]
  );

  // Start painting or panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, row?: number, col?: number) => {
      // Middle mouse button or spacebar + left click = pan
      if (e.button === 1 || (e.button === 0 && spacePressed)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        if (containerRef.current) {
          setScrollStart({
            left: containerRef.current.scrollLeft,
            top: containerRef.current.scrollTop,
          });
        }
        return;
      }

      // Left click = paint
      if (e.button === 0 && !spacePressed && row !== undefined && col !== undefined) {
        setIsPainting(true);
        paintTile(row, col);
      }
    },
    [spacePressed, selectedTerrain]
  );

  // Stop painting or panning
  const handleMouseUp = useCallback(() => {
    setIsPainting(false);
    setIsPanning(false);
    setPanStart(null);
    setScrollStart(null);
  }, []);

  // Handle mouse move for painting or panning
  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      // Handle panning
      if (isPanning && panStart && scrollStart && containerRef.current) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        containerRef.current.scrollLeft = scrollStart.left - deltaX;
        containerRef.current.scrollTop = scrollStart.top - deltaY;
        return;
      }
    },
    [isPanning, panStart, scrollStart]
  );

  // Add global mouse move and mouse up listeners when panning
  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Handle mouse enter on tile
  const handleTileMouseEnter = useCallback(
    (row: number, col: number) => {
      setHoveredTile({ row, col });

      if (isPainting && !isPanning) {
        paintTile(row, col);
      }
    },
    [isPainting, isPanning, selectedTerrain]
  );

  // Paint a tile with the selected terrain
  const paintTile = (row: number, col: number) => {
    const terrainProps = getTerrainProperties(selectedTerrain);

    onTileChange(row, col, {
      terrain: selectedTerrain,
      walkable: terrainProps.walkable,
    });
  };

  // Handle mouse leave canvas
  const handleMouseLeave = () => {
    setHoveredTile(null);
    setIsPainting(false);
  };

  // Generate visible tiles (virtualized)
  const visibleTiles = useMemo(() => {
    const tiles: JSX.Element[] = [];

    for (let row = viewportBounds.startRow; row < viewportBounds.endRow; row++) {
      if (!mapData.tiles[row]) continue;

      for (let col = viewportBounds.startCol; col < viewportBounds.endCol; col++) {
        const tile = mapData.tiles[row][col];
        if (!tile) continue;

        const terrainProps = getTerrainProperties(tile.terrain);
        const isHovered = hoveredTile?.row === row && hoveredTile?.col === col;

        tiles.push(
          <div
            key={`${row}-${col}`}
            className={styles.tile}
            style={{
              position: 'absolute',
              backgroundColor: terrainProps.color,
              width: `${effectiveTileSize}px`,
              height: `${effectiveTileSize}px`,
              left: `${col * effectiveTileSize}px`,
              top: `${row * effectiveTileSize}px`,
              opacity: isHovered ? 0.8 : 1,
              pointerEvents: isPanning ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleMouseDown(e, row, col)}
            onMouseEnter={() => handleTileMouseEnter(row, col)}
            title={`[${row}, ${col}] ${terrainProps.name}`}
          />
        );
      }
    }

    return tiles;
  }, [
    viewportBounds,
    mapData.tiles,
    effectiveTileSize,
    hoveredTile,
    isPanning,
    handleMouseDown,
    handleTileMouseEnter,
  ]);

  // Calculate total canvas size
  const canvasWidth = mapData.width * effectiveTileSize;
  const canvasHeight = mapData.height * effectiveTileSize;

  // Cursor style
  const cursorStyle = isPanning || (spacePressed && !isPainting) ? 'grabbing' : spacePressed ? 'grab' : 'crosshair';

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: cursorStyle }}
    >
      <div
        className={styles.canvas}
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          position: 'relative',
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {visibleTiles}
      </div>

      {hoveredTile && (
        <div className={styles.coordinates}>
          Row: {hoveredTile.row}, Col: {hoveredTile.col} | Zoom: {Math.round(zoom * 100)}%
        </div>
      )}

      <div className={styles.hint}>
        💡 Middle-click or Space + drag to pan • Ctrl/Cmd + scroll to zoom
      </div>
    </div>
  );
};
