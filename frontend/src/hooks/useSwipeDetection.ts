import { useCallback, useRef } from 'react';
import type { Direction, SwipeData } from '../types/game.types';

interface UseSwipeDetectionProps {
  onSwipe: (direction: Direction) => void;
  onSwipeStart?: (direction: Direction) => void;
  onSwipeEnd?: () => void;
  minSwipeDistance?: number;
}

export const useSwipeDetection = ({
  onSwipe,
  onSwipeStart,
  onSwipeEnd,
  minSwipeDistance = 30,
}: UseSwipeDetectionProps) => {
  const swipeDataRef = useRef<SwipeData>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    deltaX: 0,
    deltaY: 0,
  });

  const currentDirectionRef = useRef<Direction>('idle');
  const hasTriggeredRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeDataRef.current.startX = touch.clientX;
    swipeDataRef.current.startY = touch.clientY;
    hasTriggeredRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent scrolling while swiping
    e.preventDefault();

    const touch = e.touches[0];
    swipeDataRef.current.endX = touch.clientX;
    swipeDataRef.current.endY = touch.clientY;

    swipeDataRef.current.deltaX = swipeDataRef.current.endX - swipeDataRef.current.startX;
    swipeDataRef.current.deltaY = swipeDataRef.current.endY - swipeDataRef.current.startY;

    const { deltaX, deltaY } = swipeDataRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if swipe is strong enough
    if (absX < minSwipeDistance && absY < minSwipeDistance) {
      return;
    }

    // Determine direction based on which axis has more movement
    let direction: Direction = 'idle';

    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Trigger continuous movement once direction is detected
    if (!hasTriggeredRef.current && direction !== 'idle') {
      hasTriggeredRef.current = true;
      currentDirectionRef.current = direction;
      onSwipeStart?.(direction);
    }
  }, [onSwipeStart, minSwipeDistance]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Stop continuous movement when touch is released
      if (hasTriggeredRef.current) {
        onSwipeEnd?.();
        currentDirectionRef.current = 'idle';
        hasTriggeredRef.current = false;
      }
    },
    [onSwipeEnd]
  );

  // Mouse event handlers (for testing and desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    swipeDataRef.current.startX = e.clientX;
    swipeDataRef.current.startY = e.clientY;
    hasTriggeredRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Only track if mouse is down (buttons property)
    if (e.buttons !== 1) return;

    swipeDataRef.current.endX = e.clientX;
    swipeDataRef.current.endY = e.clientY;

    swipeDataRef.current.deltaX = swipeDataRef.current.endX - swipeDataRef.current.startX;
    swipeDataRef.current.deltaY = swipeDataRef.current.endY - swipeDataRef.current.startY;

    const { deltaX, deltaY } = swipeDataRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if swipe is strong enough
    if (absX < minSwipeDistance && absY < minSwipeDistance) {
      return;
    }

    // Determine direction
    let direction: Direction = 'idle';

    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Trigger continuous movement once direction is detected
    if (!hasTriggeredRef.current && direction !== 'idle') {
      hasTriggeredRef.current = true;
      currentDirectionRef.current = direction;
      onSwipeStart?.(direction);
    }
  }, [onSwipeStart, minSwipeDistance]);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Stop continuous movement when mouse is released
      if (hasTriggeredRef.current) {
        onSwipeEnd?.();
        currentDirectionRef.current = 'idle';
        hasTriggeredRef.current = false;
      }
    },
    [onSwipeEnd]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
