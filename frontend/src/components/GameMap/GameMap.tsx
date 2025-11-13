import { ReactNode } from 'react';
import styles from './GameMap.module.css';

interface GameMapProps {
  children: ReactNode;
}

export const GameMap: React.FC<GameMapProps> = ({ children }) => {
  return (
    <div className={styles.gameMap} data-testid="game-map">
      <div className={styles.grid}>
        {/* Simple grass tiles background */}
        {Array.from({ length: 15 }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {Array.from({ length: 10 }).map((_, colIndex) => {
              const isAlternate = (rowIndex + colIndex) % 2 === 0;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.tile} ${
                    isAlternate ? styles.tileLight : styles.tileDark
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};
