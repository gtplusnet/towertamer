import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { CharacterState, Direction, GridPosition, MapData, Position } from '../types/game.types';
import { getNextPosition, isWithinBounds, gridToPixel, calculateTileSize } from '../utils/coordinateUtils';
import { isPositionWalkable } from '../utils/mapLoader';

interface UseCharacterMovementProps {
  initialPosition: GridPosition;
  mapData: MapData;
  viewportWidth: number;
  viewportHeight: number;
}

export const useCharacterMovement = ({
  initialPosition,
  mapData,
  viewportWidth,
  viewportHeight,
}: UseCharacterMovementProps) => {
  const [character, setCharacter] = useState<CharacterState>({
    position: initialPosition,
    direction: 'idle',
    isMoving: false,
    animationFrame: 0,
  });

  const [cameraOffset, setCameraOffset] = useState<Position>({ x: 0, y: 0 });

  const movementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate tile size based on viewport - MEMOIZED to prevent infinite re-renders
  const tileSize = useMemo(
    () => calculateTileSize(
      viewportWidth,
      viewportHeight,
      mapData.width,
      mapData.height
    ),
    [viewportWidth, viewportHeight, mapData.width, mapData.height]
  );

  // Update camera offset to center character
  const updateCamera = useCallback(
    (gridPos: GridPosition) => {
      const characterPixelPos = gridToPixel(gridPos, tileSize);
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;

      // Calculate offset to center the character
      const offsetX = characterPixelPos.x - centerX;
      const offsetY = characterPixelPos.y - centerY;

      setCameraOffset({ x: offsetX, y: offsetY });
    },
    [tileSize, viewportWidth, viewportHeight]
  );

  // Update camera whenever character position changes
  useEffect(() => {
    updateCamera(character.position);
  }, [character.position, updateCamera]);

  const stopMovement = useCallback(() => {
    if (movementTimerRef.current) {
      clearTimeout(movementTimerRef.current);
      movementTimerRef.current = null;
    }
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setCharacter((prev) => ({ ...prev, isMoving: false, animationFrame: 0 }));
  }, []);

  const move = useCallback(
    (direction: Direction) => {
      if (direction === 'idle') return;

      // Clear any existing movement
      stopMovement();

      setCharacter((prev) => {
        // Calculate next position
        const nextPos = getNextPosition(prev.position, direction);

        // Check if move is valid (within bounds and walkable)
        if (!isWithinBounds(nextPos, mapData.width, mapData.height)) {
          // Can't move out of bounds
          return prev;
        }

        if (!isPositionWalkable(mapData, nextPos.row, nextPos.col)) {
          // Can't move to non-walkable tile
          return prev;
        }

        // Valid move - update position (camera will update via useEffect)
        return {
          ...prev,
          position: nextPos,
          direction,
          isMoving: true,
          animationFrame: 0,
        };
      });

      // Start animation cycle (3 frames)
      animationIntervalRef.current = setInterval(() => {
        setCharacter((prev) => ({
          ...prev,
          animationFrame: (prev.animationFrame + 1) % 3,
        }));
      }, 150); // Change frame every 150ms

      // Stop movement after animation completes
      movementTimerRef.current = setTimeout(() => {
        stopMovement();
      }, 200); // Match the CSS transition duration
    },
    [mapData, stopMovement]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (movementTimerRef.current) clearTimeout(movementTimerRef.current);
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, []);

  return {
    character,
    move,
    cameraOffset,
    tileSize,
  };
};
