import { ReactNode } from 'react';
import type { Direction } from '../../types/game.types';
import { useSwipeDetection } from '../../hooks/useSwipeDetection';
import styles from './TouchController.module.css';

interface TouchControllerProps {
  onSwipe: (direction: Direction) => void;
  children: ReactNode;
}

export const TouchController: React.FC<TouchControllerProps> = ({
  onSwipe,
  children,
}) => {
  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseUp } = useSwipeDetection({
    onSwipe,
    minSwipeDistance: 30,
  });

  return (
    <div
      className={styles.touchController}
      data-testid="touch-controller"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
      <div className={styles.swipeHint} data-testid="swipe-hint">
        <div className={styles.hintText}>👆 Swipe to move</div>
      </div>
    </div>
  );
};
