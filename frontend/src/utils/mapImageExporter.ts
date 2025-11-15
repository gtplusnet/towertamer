import { MapData } from '../types/game.types';
import { getTerrainProperties } from '../config/terrainConfig';

const TILE_SIZE = 24; // Standard tile size in pixels

/**
 * Exports a map as an image showing terrain colors
 * Used as visual reference for creating custom background images
 * @param mapData The map data to export
 * @returns A promise that resolves with the image as a Blob
 */
export async function exportMapAsImage(mapData: MapData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas size based on map dimensions
  canvas.width = mapData.width * TILE_SIZE;
  canvas.height = mapData.height * TILE_SIZE;

  // Draw each tile
  for (let row = 0; row < mapData.height; row++) {
    for (let col = 0; col < mapData.width; col++) {
      const tile = mapData.tiles[row][col];
      const terrainProps = getTerrainProperties(tile.terrain);

      // Fill tile with terrain color
      ctx.fillStyle = terrainProps.color === 'transparent' ? '#ffffff' : terrainProps.color;
      ctx.fillRect(
        col * TILE_SIZE,
        row * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );

      // Draw grid lines for visual reference
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        col * TILE_SIZE,
        row * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create image blob'));
      }
    }, 'image/png');
  });
}

/**
 * Downloads the map as a PNG file
 * @param mapData The map data to export
 * @param filename Optional filename (defaults to map name)
 */
export async function downloadMapImage(mapData: MapData, filename?: string): Promise<void> {
  const blob = await exportMapAsImage(mapData);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${mapData.slug || 'map'}_${mapData.width}x${mapData.height}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}
