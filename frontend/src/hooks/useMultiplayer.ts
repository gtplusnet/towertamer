import { useEffect, useState, useRef } from 'react';
import { socketService } from '../services/socket.service';
import type { OtherPlayerData, PlayerMoveData, PlayerLeftData } from '../services/socket.service';
import { useAuth } from '../contexts/AuthContext';

export const useMultiplayer = (currentMap: string) => {
  const [otherPlayers, setOtherPlayers] = useState<Map<string, OtherPlayerData>>(new Map());
  const { user } = useAuth();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Connect to socket server
    if (!isConnectedRef.current) {
      socketService.connect();
      isConnectedRef.current = true;
    }

    // Handle player joined
    const handlePlayerJoined = (player: OtherPlayerData) => {
      // Don't add self
      if (player.userId === user?.id) return;

      // Only add if on same map
      if (player.currentMap === currentMap) {
        setOtherPlayers((prev) => {
          const newMap = new Map(prev);
          newMap.set(player.userId, player);
          console.log(`👤 Player joined: ${player.username}`);
          return newMap;
        });
      }
    };

    // Handle player moved
    const handlePlayerMoved = (data: PlayerMoveData) => {
      // Don't update self
      if (data.userId === user?.id) return;

      setOtherPlayers((prev) => {
        const player = prev.get(data.userId);

        if (player) {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            ...player,
            position: data.position,
            direction: data.direction,
          });
          return newMap;
        }

        return prev;
      });
    };

    // Handle player left
    const handlePlayerLeft = (data: PlayerLeftData) => {
      setOtherPlayers((prev) => {
        if (prev.has(data.userId)) {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          console.log(`👋 Player left: ${data.username}`);
          return newMap;
        }

        return prev;
      });
    };

    // Handle players list (on join/map change)
    const handlePlayersList = (players: OtherPlayerData[]) => {
      const newMap = new Map<string, OtherPlayerData>();

      players.forEach((player) => {
        // Don't add self
        if (player.userId !== user?.id) {
          newMap.set(player.userId, player);
        }
      });

      setOtherPlayers(newMap);
      console.log(`📋 Received players list: ${newMap.size} players on map`);
    };

    // Register event listeners
    socketService.onPlayerJoined(handlePlayerJoined);
    socketService.onPlayerMoved(handlePlayerMoved);
    socketService.onPlayerLeft(handlePlayerLeft);
    socketService.onPlayersList(handlePlayersList);

    // Cleanup on unmount
    return () => {
      socketService.off('player:joined', handlePlayerJoined);
      socketService.off('player:moved', handlePlayerMoved);
      socketService.off('player:left', handlePlayerLeft);
      socketService.off('players:list', handlePlayersList);
    };
  }, [currentMap, user?.id]);

  return {
    otherPlayers,
    isConnected: socketService.isConnected(),
  };
};
