import { useCallback, useRef } from 'react';
import type { Direction, SwipeData } from '../types/game.types';

interface UseSwipeDetectionProps {
  onSwipe: (direction: Direction) => void;
  minSwipeDistance?: number;
}

export const useSwipeDetection = ({
  onSwipe,
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeDataRef.current.startX = touch.clientX;
    swipeDataRef.current.startY = touch.clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent scrolling while swiping
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      swipeDataRef.current.endX = touch.clientX;
      swipeDataRef.current.endY = touch.clientY;

      swipeDataRef.current.deltaX =
        swipeDataRef.current.endX - swipeDataRef.current.startX;
      swipeDataRef.current.deltaY =
        swipeDataRef.current.endY - swipeDataRef.current.startY;

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
        // Horizontal swipe
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? 'down' : 'up';
      }

      onSwipe(direction);
    },
    [onSwipe, minSwipeDistance]
  );

  // Mouse event handlers (for testing and desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    swipeDataRef.current.startX = e.clientX;
    swipeDataRef.current.startY = e.clientY;
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      swipeDataRef.current.endX = e.clientX;
      swipeDataRef.current.endY = e.clientY;

      swipeDataRef.current.deltaX =
        swipeDataRef.current.endX - swipeDataRef.current.startX;
      swipeDataRef.current.deltaY =
        swipeDataRef.current.endY - swipeDataRef.current.startY;

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
        // Horizontal swipe
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? 'down' : 'up';
      }

      onSwipe(direction);
    },
    [onSwipe, minSwipeDistance]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
  };
};
