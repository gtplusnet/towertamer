import { useCallback, useEffect, useRef, useState } from 'react';
import type { Direction } from '../types/game.types';

interface UseJoystickDetectionProps {
  onDirectionChange: (direction: Direction) => void;
  onJoystickStart: () => void;
  onJoystickEnd: () => void;
  deadZone?: number; // Minimum distance from center to register movement
}

interface JoystickState {
  active: boolean;
  baseX: number;
  baseY: number;
  thumbX: number;
  thumbY: number;
}

export const useJoystickDetection = ({
  onDirectionChange,
  onJoystickStart,
  onJoystickEnd,
  deadZone = 20,
}: UseJoystickDetectionProps) => {
  const [joystick, setJoystick] = useState<JoystickState>({
    active: false,
    baseX: 0,
    baseY: 0,
    thumbX: 0,
    thumbY: 0,
  });

  const currentDirectionRef = useRef<Direction>('idle');
  const elementRef = useRef<HTMLDivElement>(null);

  // Calculate direction from joystick position
  const calculateDirection = useCallback((deltaX: number, deltaY: number): Direction => {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Dead zone check
    if (distance < deadZone) {
      return 'idle';
    }

    // Calculate angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Normalize to 0-360
    if (angle < 0) angle += 360;

    // Convert to 4 directions (prioritize cardinal directions for grid movement)
    if (angle >= 315 || angle < 45) {
      return 'right';
    } else if (angle >= 45 && angle < 135) {
      return 'down';
    } else if (angle >= 135 && angle < 225) {
      return 'left';
    } else {
      return 'up';
    }
  }, [deadZone]);

  // Store joystick state in ref for event handlers to avoid stale closures
  const joystickRef = useRef(joystick);
  joystickRef.current = joystick;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const baseX = touch.clientX;
    const baseY = touch.clientY;

    setJoystick({
      active: true,
      baseX,
      baseY,
      thumbX: baseX,
      thumbY: baseY,
    });

    onJoystickStart();
  }, [onJoystickStart]);

  const handleTouchEnd = useCallback(() => {
    setJoystick({
      active: false,
      baseX: 0,
      baseY: 0,
      thumbX: 0,
      thumbY: 0,
    });

    currentDirectionRef.current = 'idle';
    onJoystickEnd();
  }, [onJoystickEnd]);

  // Native touch move handler with preventDefault support
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      const currentJoystick = joystickRef.current;
      if (!currentJoystick.active) return;

      const touch = e.touches[0];
      const thumbX = touch.clientX;
      const thumbY = touch.clientY;

      // Calculate delta from base
      const deltaX = thumbX - currentJoystick.baseX;
      const deltaY = thumbY - currentJoystick.baseY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Calculate direction first
      const calcDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      let direction: Direction = 'idle';

      // Dead zone check
      if (calcDistance >= deadZone) {
        // Calculate angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        // Normalize to 0-360
        if (angle < 0) angle += 360;

        // Convert to 4 directions (prioritize cardinal directions for grid movement)
        if (angle >= 315 || angle < 45) {
          direction = 'right';
        } else if (angle >= 45 && angle < 135) {
          direction = 'down';
        } else if (angle >= 135 && angle < 225) {
          direction = 'left';
        } else {
          direction = 'up';
        }
      }

      // Snap thumb to cardinal directions only
      const maxRadius = 60;
      let constrainedX = currentJoystick.baseX;
      let constrainedY = currentJoystick.baseY;

      if (direction !== 'idle') {
        const actualDistance = Math.min(distance, maxRadius);

        // Snap to cardinal axes
        if (direction === 'right') {
          constrainedX = currentJoystick.baseX + actualDistance;
          constrainedY = currentJoystick.baseY;
        } else if (direction === 'left') {
          constrainedX = currentJoystick.baseX - actualDistance;
          constrainedY = currentJoystick.baseY;
        } else if (direction === 'down') {
          constrainedX = currentJoystick.baseX;
          constrainedY = currentJoystick.baseY + actualDistance;
        } else if (direction === 'up') {
          constrainedX = currentJoystick.baseX;
          constrainedY = currentJoystick.baseY - actualDistance;
        }
      }

      setJoystick(prev => ({
        ...prev,
        thumbX: constrainedX,
        thumbY: constrainedY,
      }));

      if (direction !== currentDirectionRef.current) {
        currentDirectionRef.current = direction;
        onDirectionChange(direction);
      }
    };

    // Add with passive: false to allow preventDefault
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [deadZone, onDirectionChange]);

  // Mouse handlers for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const baseX = e.clientX;
    const baseY = e.clientY;

    setJoystick({
      active: true,
      baseX,
      baseY,
      thumbX: baseX,
      thumbY: baseY,
    });

    onJoystickStart();
  }, [onJoystickStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1 || !joystick.active) return;

    const thumbX = e.clientX;
    const thumbY = e.clientY;

    const deltaX = thumbX - joystick.baseX;
    const deltaY = thumbY - joystick.baseY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Calculate direction first
    const direction = calculateDirection(deltaX, deltaY);

    // Snap thumb to cardinal directions only
    const maxRadius = 60;
    let constrainedX = joystick.baseX;
    let constrainedY = joystick.baseY;

    if (direction !== 'idle') {
      const actualDistance = Math.min(distance, maxRadius);

      // Snap to cardinal axes
      if (direction === 'right') {
        constrainedX = joystick.baseX + actualDistance;
        constrainedY = joystick.baseY;
      } else if (direction === 'left') {
        constrainedX = joystick.baseX - actualDistance;
        constrainedY = joystick.baseY;
      } else if (direction === 'down') {
        constrainedX = joystick.baseX;
        constrainedY = joystick.baseY + actualDistance;
      } else if (direction === 'up') {
        constrainedX = joystick.baseX;
        constrainedY = joystick.baseY - actualDistance;
      }
    }

    setJoystick(prev => ({
      ...prev,
      thumbX: constrainedX,
      thumbY: constrainedY,
    }));

    if (direction !== currentDirectionRef.current) {
      currentDirectionRef.current = direction;
      onDirectionChange(direction);
    }
  }, [joystick.active, joystick.baseX, joystick.baseY, calculateDirection, onDirectionChange]);

  const handleMouseUp = useCallback(() => {
    setJoystick({
      active: false,
      baseX: 0,
      baseY: 0,
      thumbX: 0,
      thumbY: 0,
    });

    currentDirectionRef.current = 'idle';
    onJoystickEnd();
  }, [onJoystickEnd]);

  return {
    joystick,
    elementRef,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
