import { useState, useEffect, useCallback } from 'react';
import { GameMap } from './components/GameMap/GameMap';
import { Character } from './components/Character/Character';
import { JoystickController } from './components/JoystickController/JoystickController';
import { FadeTransition } from './components/FadeTransition/FadeTransition';
import { useCharacterMovement } from './hooks/useCharacterMovement';
import { loadMap } from './utils/mapLoader';
import type { MapData, Direction, PortalData, GridPosition } from './types/game.types';
import styles from './App.module.css';

function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [characterPosition, setCharacterPosition] = useState<GridPosition>({ row: 15, col: 10 });
  const [currentMapPath, setCurrentMapPath] = useState('/src/data/maps/map01.json');

  // Load map data on mount and when map changes
  useEffect(() => {
    setIsLoading(true);
    loadMap(currentMapPath)
      .then((data) => {
        setMapData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load map:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      });
  }, [currentMapPath]);

  // Responsive viewport dimensions
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Update viewport dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle portal entry - switch to new map with fade transition
  const handlePortalEnter = useCallback((portalData: PortalData) => {
    setIsTransitioning(true);

    // After fade-out (300ms), load new map
    setTimeout(() => {
      setCharacterPosition(portalData.targetPosition);
      setCurrentMapPath(portalData.targetMap);

      // After map loads, fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  }, []);

  // Initialize character movement (only after map is loaded)
  const { character, move, startContinuousMovement, stopMovement, cameraOffset, tileSize } = useCharacterMovement({
    initialPosition: characterPosition,
    mapData: mapData || { name: '', width: 20, height: 30, tiles: [] },
    viewportWidth,
    viewportHeight,
    onPortalEnter: handlePortalEnter,
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
        <GameMap mapData={mapData} cameraOffset={cameraOffset} tileSize={tileSize} />
        <Character
          gridPosition={character.position}
          direction={character.direction}
          animationFrame={character.animationFrame}
          isMoving={character.isMoving}
          tileSize={tileSize}
        />
      </JoystickController>
      <FadeTransition isTransitioning={isTransitioning} />
    </div>
  );
}

export default App;
