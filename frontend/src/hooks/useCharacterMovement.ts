import { useState, useCallback, useEffect, useRef } from 'react';
import type { CharacterState, Direction, GameMapBounds } from '../types/game.types';

interface UseCharacterMovementProps {
  initialX?: number;
  initialY?: number;
  moveSpeed?: number;
  bounds: GameMapBounds;
}

export const useCharacterMovement = ({
  initialX = 150,
  initialY = 250,
  moveSpeed = 48,
  bounds,
}: UseCharacterMovementProps) => {
  const [character, setCharacter] = useState<CharacterState>({
    position: { x: initialX, y: initialY },
    direction: 'idle',
    isMoving: false,
    animationFrame: 0,
  });

  const movementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        let newX = prev.position.x;
        let newY = prev.position.y;

        // Calculate new position
        switch (direction) {
          case 'up':
            newY = Math.max(bounds.minY, prev.position.y - moveSpeed);
            break;
          case 'down':
            newY = Math.min(bounds.maxY, prev.position.y + moveSpeed);
            break;
          case 'left':
            newX = Math.max(bounds.minX, prev.position.x - moveSpeed);
            break;
          case 'right':
            newX = Math.min(bounds.maxX, prev.position.x + moveSpeed);
            break;
        }

        return {
          ...prev,
          position: { x: newX, y: newY },
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
    [moveSpeed, bounds, stopMovement]
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
  };
};
