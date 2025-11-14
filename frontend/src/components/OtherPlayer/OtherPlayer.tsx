import React from 'react';
import type { GridPosition, Direction } from '../../types/game.types';
import styles from './OtherPlayer.module.css';

interface OtherPlayerProps {
  username: string;
  gridPosition: GridPosition;
  direction: Direction;
  tileSize: number;
}

export const OtherPlayer: React.FC<OtherPlayerProps> = ({
  username,
  gridPosition,
  direction,
  tileSize,
}) => {
  const pixelX = gridPosition.col * tileSize;
  const pixelY = gridPosition.row * tileSize;

  // Calculate sprite position (same logic as Character component)
  const getDirectionRow = (): number => {
    switch (direction) {
      case 'down':
        return 0;
      case 'left':
        return 1;
      case 'right':
        return 2;
      case 'up':
        return 3;
      default:
        return 0;
    }
  };

  const spriteRow = getDirectionRow();
  const backgroundPositionY = -spriteRow * tileSize;

  return (
    <div
      className={styles.otherPlayer}
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
      }}
    >
      <div
        className={styles.sprite}
        style={{
          width: `${tileSize}px`,
          height: `${tileSize}px`,
          backgroundPosition: `0px ${backgroundPositionY}px`,
          backgroundSize: `${tileSize}px auto`,
        }}
      />
      <div className={styles.username}>{username}</div>
    </div>
  );
};
