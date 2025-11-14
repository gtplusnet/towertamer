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
  const [currentMapId, setCurrentMapId] = useState<string | null>(
    playerState?.currentMap || null
  );

  // Load map data on mount and when map changes
  useEffect(() => {
    const loadMapData = async () => {
      setIsLoading(true);
      try {
        let data: MapData;

        if (currentMapId) {
          // Load specific map by ObjectId
          data = await loadMap(currentMapId);
        } else {
          // Load default spawn map
          const { loadDefaultMap } = await import('../utils/mapLoader');
          data = await loadDefaultMap();
          setCurrentMapId(data._id); // Update current map ID
          setCharacterPosition({ row: 10, col: 15 }); // Default spawn position
        }

        setMapData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load map:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      }
    };

    loadMapData();
  }, [currentMapId]);

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
      setCurrentMapId(portalData.targetMapId);

      // Emit map change to socket
      if (socketService.isConnected()) {
        socketService.emitPlayerMapChange({
          newMap: portalData.targetMapId,
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
  const { character, startContinuousMovement, stopMovement, cameraOffset, tileSize } = useCharacterMovement({
    initialPosition: characterPosition,
    mapData: mapData || {
      _id: '',
      name: '',
      slug: '',
      width: 20,
      height: 30,
      tiles: [],
      isPublished: false,
      isDefaultSpawn: false,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    viewportWidth,
    viewportHeight,
    onPortalEnter: handlePortalEnter,
  });

  // Initialize multiplayer
  const { otherPlayers } = useMultiplayer(currentMapId || '');

  // Emit socket events when character moves
  useEffect(() => {
    if (!socketService.isConnected() || !mapData || !currentMapId) return;

    socketService.emitPlayerMove({
      position: character.position,
      direction: character.direction,
      currentMap: currentMapId,
    });
  }, [character.position, character.direction, currentMapId, mapData]);

  // Handle map reset from server (when trying to access unpublished map)
  useEffect(() => {
    const handleMapReset = (data: { message: string; newMap: string; newPosition: GridPosition }) => {
      console.warn('Map access denied:', data.message);
      setIsTransitioning(true);

      setTimeout(() => {
        setCharacterPosition(data.newPosition);
        setCurrentMapId(data.newMap);

        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 300);
    };

    const handleError = (error: { message: string }) => {
      console.error('Socket error:', error.message);
      setError(error.message);
    };

    socketService.onMapReset(handleMapReset);
    socketService.onError(handleError);

    return () => {
      socketService.off('map:reset', handleMapReset);
      socketService.off('error', handleError);
    };
  }, []);

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
