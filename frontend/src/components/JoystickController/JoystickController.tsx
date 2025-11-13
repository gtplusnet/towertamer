import { ReactNode } from 'react';
import type { Direction } from '../../types/game.types';
import { useJoystickDetection } from '../../hooks/useJoystickDetection';
import styles from './JoystickController.module.css';

interface JoystickControllerProps {
  onDirectionChange: (direction: Direction) => void;
  onStart: () => void;
  onEnd: () => void;
  children: ReactNode;
}

export const JoystickController: React.FC<JoystickControllerProps> = ({
  onDirectionChange,
  onStart,
  onEnd,
  children,
}) => {
  const {
    joystick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useJoystickDetection({
    onDirectionChange,
    onJoystickStart: onStart,
    onJoystickEnd: onEnd,
    deadZone: 20,
  });

  return (
    <div
      className={styles.joystickController}
      data-testid="joystick-controller"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {children}

      {/* Joystick visual */}
      {joystick.active && (
        <div
          className={styles.joystickBase}
          style={{
            left: `${joystick.baseX}px`,
            top: `${joystick.baseY}px`,
          }}
        >
          <div
            className={styles.joystickThumb}
            style={{
              left: `calc(50% + ${joystick.thumbX - joystick.baseX}px)`,
              top: `calc(50% + ${joystick.thumbY - joystick.baseY}px)`,
            }}
          />
        </div>
      )}
    </div>
  );
};
