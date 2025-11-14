import { useState, useEffect, useCallback } from 'react';
import { GameMap } from '../components/GameMap/GameMap';
import { Character } from '../components/Character/Character';
import { OtherPlayer } from '../components/OtherPlayer/OtherPlayer';
import { JoystickController } from '../components/JoystickController/JoystickController';
import { FadeTransition } from '../components/FadeTransition/FadeTransition';
import { useCharacterMovement } from '../hooks/useCharacterMovement';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { loadMap } from '../utils/mapLoader';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../services/socket.service';
import type { MapData, Direction, PortalData, GridPosition } from '../types/game.types';
import styles from '../App.module.css';

export const GamePage = () => {
  const { playerState } = useAuth();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize position from playerState or default
  const [characterPosition, setCharacterPosition] = useState<GridPosition>(
    playerState?.position || { row: 10, col: 15 }
  );
  const [currentMapPath, setCurrentMapPath] = useState(
    playerState?.currentMap ? `/src/data/maps/${playerState.currentMap}` : '/src/data/maps/map01.json'
  );

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

      // Emit map change to socket
      const newMapFilename = portalData.targetMap.split('/').pop() || 'map01.json';
      if (socketService.isConnected()) {
        socketService.emitPlayerMapChange({
          newMap: newMapFilename,
          newPosition: portalData.targetPosition,
        });
      }

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

  // Get current map filename from path
  const currentMapFilename = currentMapPath.split('/').pop() || 'map01.json';

  // Initialize multiplayer
  const { otherPlayers } = useMultiplayer(currentMapFilename);

  // Emit socket events when character moves
  useEffect(() => {
    if (!socketService.isConnected() || !mapData) return;

    socketService.emitPlayerMove({
      position: character.position,
      direction: character.direction,
      currentMap: currentMapFilename,
    });
  }, [character.position, character.direction, currentMapFilename, mapData]);

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
          {/* Render other players inside map (they move with the map) */}
          {Array.from(otherPlayers.values()).map((player) => (
            <OtherPlayer
              key={player.userId}
              username={player.username}
              gridPosition={player.position}
              direction={player.direction}
              tileSize={tileSize}
            />
          ))}
        </GameMap>
        {/* Render main character OUTSIDE map (position: fixed, stays centered) */}
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
};
