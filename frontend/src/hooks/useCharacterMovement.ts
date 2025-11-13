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
  const continuousMovementRef = useRef<NodeJS.Timeout | null>(null);
  const currentDirectionRef = useRef<Direction>('idle');

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
    if (continuousMovementRef.current) {
      clearInterval(continuousMovementRef.current);
      continuousMovementRef.current = null;
    }
    currentDirectionRef.current = 'idle';
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

  // Start continuous movement in a direction
  const startContinuousMovement = useCallback(
    (direction: Direction) => {
      if (direction === 'idle') return;

      // Clear any existing timers
      stopMovement();

      // Set the current direction
      currentDirectionRef.current = direction;

      // Function to perform one movement step
      const performMove = () => {
        setCharacter((prev) => {
          const nextPos = getNextPosition(prev.position, currentDirectionRef.current);

          // Check if move is valid
          if (!isWithinBounds(nextPos, mapData.width, mapData.height)) {
            return { ...prev, direction: currentDirectionRef.current };
          }

          if (!isPositionWalkable(mapData, nextPos.row, nextPos.col)) {
            return { ...prev, direction: currentDirectionRef.current };
          }

          // Valid move - update position
          return {
            ...prev,
            position: nextPos,
            direction: currentDirectionRef.current,
            isMoving: true,
            animationFrame: (prev.animationFrame + 1) % 3,
          };
        });
      };

      // Perform first move immediately
      performMove();

      // Start continuous movement interval (move every 150ms)
      continuousMovementRef.current = setInterval(performMove, 150);

      // Start animation cycle
      animationIntervalRef.current = setInterval(() => {
        setCharacter((prev) => ({
          ...prev,
          animationFrame: (prev.animationFrame + 1) % 3,
        }));
      }, 150);
    },
    [mapData, stopMovement]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (movementTimerRef.current) clearTimeout(movementTimerRef.current);
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (continuousMovementRef.current) clearInterval(continuousMovementRef.current);
    };
  }, []);

  return {
    character,
    move,
    startContinuousMovement,
    stopMovement,
    cameraOffset,
    tileSize,
  };
};
