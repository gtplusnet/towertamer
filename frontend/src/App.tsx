import { useState, useEffect } from 'react';
import { GameMap } from './components/GameMap/GameMap';
import { Character } from './components/Character/Character';
import { JoystickController } from './components/JoystickController/JoystickController';
import { useCharacterMovement } from './hooks/useCharacterMovement';
import { loadMap } from './utils/mapLoader';
import type { MapData, Direction } from './types/game.types';
import styles from './App.module.css';

function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load map data on mount
  useEffect(() => {
    loadMap('/src/data/maps/map01.json')
      .then((data) => {
        setMapData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load map:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      });
  }, []);

  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Initialize character movement (only after map is loaded)
  const { character, move, startContinuousMovement, stopMovement, cameraOffset, tileSize } = useCharacterMovement({
    initialPosition: { row: 7, col: 5 }, // Center of map
    mapData: mapData || { name: '', width: 10, height: 15, tiles: [] },
    viewportWidth,
    viewportHeight,
  });

  if (isLoading) {
    return (
      <div className={styles.app}>
        <div style={{ color: 'white', textAlign: 'center', marginTop: '50%' }}>
          Loading map...
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className={styles.app}>
        <div style={{ color: 'red', textAlign: 'center', marginTop: '50%' }}>
          {error || 'Failed to load game'}
        </div>
      </div>
    );
  }

  // Handle joystick direction changes
  const handleDirectionChange = (direction: Direction) => {
    if (direction === 'idle') {
      stopMovement();
    } else {
      startContinuousMovement(direction);
    }
  };

  return (
    <div className={styles.app}>
      <JoystickController
        onDirectionChange={handleDirectionChange}
        onStart={() => {}}
        onEnd={stopMovement}
      >
        <GameMap mapData={mapData} cameraOffset={cameraOffset} tileSize={tileSize}>
          <Character
            gridPosition={character.position}
            direction={character.direction}
            animationFrame={character.animationFrame}
            isMoving={character.isMoving}
            tileSize={tileSize}
          />
        </GameMap>
      </JoystickController>
    </div>
  );
}

export default App;
