import { useEffect, useRef } from 'react';
import type { Direction, Position } from '../../types/game.types';
import { characterSprites, renderSprite } from '../../utils/spriteRenderer';
import styles from './Character.module.css';

interface CharacterProps {
  position: Position;
  direction: Direction;
  animationFrame: number;
  isMoving: boolean;
}

export const Character: React.FC<CharacterProps> = ({
  position,
  direction,
  animationFrame,
  isMoving,
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

  return (
    <div
      className={styles.character}
      data-testid="character"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <canvas ref={canvasRef} className={styles.sprite} data-testid="character-canvas" />
    </div>
  );
};
