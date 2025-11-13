import { useEffect, useRef } from 'react';
import type { Direction, GridPosition } from '../../types/game.types';
import type { TileSize } from '../../utils/coordinateUtils';
import { characterSprites, renderSprite } from '../../utils/spriteRenderer';
import { gridToPixel } from '../../utils/coordinateUtils';
import styles from './Character.module.css';

interface CharacterProps {
  gridPosition: GridPosition;
  direction: Direction;
  animationFrame: number;
  isMoving: boolean;
  tileSize: TileSize;
}

export const Character: React.FC<CharacterProps> = ({
  gridPosition,
  direction,
  animationFrame,
  isMoving,
  tileSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const currentDirection = direction === 'idle' ? 'down' : direction;
    const sprites = characterSprites[currentDirection];
    const frame = isMoving ? animationFrame % sprites.length : 0;
    const sprite = sprites[frame];

    renderSprite(canvasRef.current, sprite, 3);
  }, [direction, animationFrame, isMoving]);

  // Calculate pixel position from grid position
  const pixelPos = gridToPixel(gridPosition, tileSize);

  return (
    <div
      className={styles.character}
      data-testid="character"
      data-grid-row={gridPosition.row}
      data-grid-col={gridPosition.col}
      style={{
        left: `${pixelPos.x}px`,
        top: `${pixelPos.y}px`,
      }}
    >
      <canvas ref={canvasRef} className={styles.sprite} data-testid="character-canvas" />
    </div>
  );
};
