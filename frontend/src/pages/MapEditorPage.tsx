import React, { useState, useEffect, useRef } from 'react';
import { mapService } from '../services/map.service';
import type { MapData, MapListItem, Tile } from '../types/game.types';
import { TerrainType } from '../types/game.types';
import { TileSelector } from '../components/MapEditor/TileSelector';
import { MapEditorCanvas } from '../components/MapEditor/MapEditorCanvas';
import { downloadMapImage } from '../utils/mapImageExporter';
import styles from './MapEditorPage.module.css';

export const MapEditorPage: React.FC = () => {
  const [maps, setMaps] = useState<MapListItem[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Selected terrain for painting
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>(TerrainType.NONE);

  // Zoom level (0.25 = 25%, 1 = 100%, 2 = 200%)
  const [zoom, setZoom] = useState<number>(1);

  // File input ref for background image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom levels available
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2];

  // Load all maps on mount
  useEffect(() => {
    loadMaps();
  }, []);

  // Load map list
  const loadMaps = async () => {
    try {
      setIsLoading(true);
      const response = await mapService.getAllMaps();

      if (response.success && response.data) {
        setMaps(response.data.maps);
      } else {
        setError(response.message || 'Failed to load maps');
      }
    } catch (err) {
      console.error('Error loading maps:', err);
      setError('Failed to load maps');
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific map with full tile data
  const loadMap = async (mapId: string) => {
    try {
      setIsLoading(true);
      setSelectedMapId(mapId);

      const response = await mapService.getMapById(mapId);

      if (response.success && response.data) {
        setCurrentMap(response.data.map);
        setError(null);
      } else {
        setError(response.message || 'Failed to load map');
      }
    } catch (err) {
      console.error('Error loading map:', err);
      setError('Failed to load map');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new map
  const handleCreateMap = async () => {
    const name = prompt('Enter map name:');
    if (!name) return;

    const width = parseInt(prompt('Enter map width (10-500):', '20') || '20');
    const height = parseInt(prompt('Enter map height (10-500):', '30') || '30');

    if (width < 10 || width > 500 || height < 10 || height > 500) {
      alert('Invalid dimensions. Width and height must be between 10 and 500.');
      return;
    }

    try {
      setIsLoading(true);

      // Create empty map with none (transparent) tiles
      const tiles: Tile[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
          terrain: TerrainType.NONE,
          walkable: true,
        }))
      );

      const response = await mapService.createMap({
        name,
        width,
        height,
        tiles,
        isPublished: false,
        isDefaultSpawn: false,
      });

      if (response.success && response.data) {
        await loadMaps(); // Refresh map list
        loadMap(response.data.map._id); // Load the new map
      } else {
        alert(response.message || 'Failed to create map');
      }
    } catch (err) {
      console.error('Error creating map:', err);
      alert('Failed to create map');
    } finally {
      setIsLoading(false);
    }
  };

  // Save current map
  const handleSaveMap = async () => {
    if (!currentMap) return;

    try {
      setIsSaving(true);

      const response = await mapService.updateMap(currentMap._id, {
        tiles: currentMap.tiles,
        name: currentMap.name,
      });

      if (response.success) {
        alert('Map saved successfully!');
        await loadMaps(); // Refresh map list
      } else {
        alert(response.message || 'Failed to save map');
      }
    } catch (err) {
      console.error('Error saving map:', err);
      alert('Failed to save map');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async () => {
    if (!currentMap) return;

    try {
      const response = await mapService.togglePublish(currentMap._id);

      if (response.success && response.data) {
        setCurrentMap(response.data.map);
        await loadMaps(); // Refresh map list
        alert(`Map ${response.data.map.isPublished ? 'published' : 'unpublished'} successfully!`);
      } else {
        alert(response.message || 'Failed to toggle publish status');
      }
    } catch (err) {
      console.error('Error toggling publish:', err);
      alert('Failed to toggle publish status');
    }
  };

  // Set as default spawn
  const handleSetDefaultSpawn = async () => {
    if (!currentMap) return;

    if (!confirm('Set this map as the default spawn map? This will unset the current default.')) {
      return;
    }

    try {
      const response = await mapService.setDefaultSpawn(currentMap._id);

      if (response.success && response.data) {
        setCurrentMap(response.data.map);
        await loadMaps(); // Refresh map list
        alert('Default spawn map updated successfully!');
      } else {
        alert(response.message || 'Failed to set default spawn');
      }
    } catch (err) {
      console.error('Error setting default spawn:', err);
      alert('Failed to set default spawn');
    }
  };

  // Update map name
  const handleUpdateMapName = async () => {
    if (!currentMap) return;

    const newName = prompt('Enter new map name:', currentMap.name);
    if (!newName || newName === currentMap.name) return;

    try {
      const response = await mapService.updateMap(currentMap._id, { name: newName });

      if (response.success && response.data) {
        setCurrentMap(response.data.map);
        await loadMaps(); // Refresh map list
        alert('Map name updated successfully!');
      } else {
        alert(response.message || 'Failed to update map name');
      }
    } catch (err) {
      console.error('Error updating map name:', err);
      alert('Failed to update map name');
    }
  };

  // Delete map
  const handleDeleteMap = async () => {
    if (!currentMap) return;

    if (!confirm(`Are you sure you want to delete "${currentMap.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await mapService.deleteMap(currentMap._id);

      if (response.success) {
        alert('Map deleted successfully!');
        setCurrentMap(null);
        setSelectedMapId(null);
        await loadMaps(); // Refresh map list
      } else {
        alert(response.message || 'Failed to delete map');
      }
    } catch (err) {
      console.error('Error deleting map:', err);
      alert('Failed to delete map');
    }
  };

  // Handle tile change from canvas
  const handleTileChange = (row: number, col: number, tile: Tile) => {
    if (!currentMap) return;

    // Create a deep copy of the tiles array
    const newTiles = currentMap.tiles.map((r, rowIndex) =>
      r.map((t, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return tile;
        }
        return t;
      })
    );

    // Update current map state
    setCurrentMap({
      ...currentMap,
      tiles: newTiles,
    });
  };

  // Handle zoom in
  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  // Handle zoom reset
  const handleZoomReset = () => {
    setZoom(1);
  };

  // Handle download background image
  const handleDownloadBackground = async () => {
    if (!currentMap) return;

    try {
      await downloadMapImage(currentMap);
      alert('Map image downloaded successfully!');
    } catch (err) {
      console.error('Error downloading map:', err);
      alert('Failed to download map image');
    }
  };

  // Handle upload background image button click
  const handleUploadBackgroundClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentMap) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a PNG or JPEG image');
      event.target.value = ''; // Reset input
      return;
    }

    try {
      setIsUploading(true);
      const response = await mapService.uploadBackgroundImage(currentMap._id, file);

      if (response.success && response.data) {
        setCurrentMap(response.data.map);
        alert('Background image uploaded successfully!');
      } else {
        alert(response.message || 'Failed to upload background image');
      }
    } catch (err) {
      console.error('Error uploading background:', err);
      alert('Failed to upload background image');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  if (isLoading && maps.length === 0) {
    return <div className={styles.loading}>Loading maps...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Left Sidebar - Map List */}
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Maps</h2>
        </div>
        <div className={styles.sidebarContent}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleCreateMap}
            style={{ width: '100%', marginBottom: '15px' }}
          >
            + Create New Map
          </button>

          {maps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
              No maps yet. Create your first map!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {maps.map((map) => (
                <div
                  key={map._id}
                  onClick={() => loadMap(map._id)}
                  style={{
                    padding: '12px',
                    background: selectedMapId === map._id ? '#533483' : '#0f3460',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedMapId !== map._id) {
                      e.currentTarget.style.background = '#1a4d7a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMapId !== map._id) {
                      e.currentTarget.style.background = '#0f3460';
                    }
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{map.name}</div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    {map.width} x {map.height}
                    {map.isDefaultSpawn && (
                      <span style={{ marginLeft: '8px', color: '#e94560' }}>DEFAULT</span>
                    )}
                    {!map.isPublished && (
                      <span style={{ marginLeft: '8px', color: '#ffa726' }}>DRAFT</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Canvas */}
      <div className={styles.mainContent}>
        <div className={styles.toolbar}>
          <h1
            className={styles.toolbarTitle}
            onClick={currentMap ? handleUpdateMapName : undefined}
            style={{ cursor: currentMap ? 'pointer' : 'default' }}
            title={currentMap ? 'Click to edit map name' : ''}
          >
            {currentMap ? currentMap.name : 'Map Editor'}
          </h1>
          {currentMap && (
            <>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleSaveMap}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button className={styles.button} onClick={handleTogglePublish}>
                {currentMap.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button
                className={styles.button}
                onClick={handleSetDefaultSpawn}
                disabled={currentMap.isDefaultSpawn}
              >
                Set as Default Spawn
              </button>
              <button
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={handleDeleteMap}
              >
                Delete
              </button>

              {/* Background Image Controls */}
              <button
                className={styles.button}
                onClick={handleDownloadBackground}
                title="Download map as PNG image (for creating custom backgrounds)"
                style={{ marginLeft: '20px' }}
              >
                📥 Download BG
              </button>
              <button
                className={styles.button}
                onClick={handleUploadBackgroundClick}
                disabled={isUploading}
                title="Upload custom background image"
              >
                {isUploading ? 'Uploading...' : '📤 Upload BG'}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelected}
                style={{ display: 'none' }}
              />

              {/* Zoom Controls */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className={styles.button}
                  onClick={handleZoomOut}
                  disabled={zoom === zoomLevels[0]}
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  className={styles.button}
                  onClick={handleZoomReset}
                  title="Reset Zoom"
                  style={{ minWidth: '60px' }}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  className={styles.button}
                  onClick={handleZoomIn}
                  disabled={zoom === zoomLevels[zoomLevels.length - 1]}
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.canvasContainer}>
          {!currentMap ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🗺️</div>
              <div className={styles.emptyStateText}>
                Select a map from the left or create a new one to get started
              </div>
            </div>
          ) : (
            <MapEditorCanvas
              mapData={currentMap}
              selectedTerrain={selectedTerrain}
              onTileChange={handleTileChange}
              tileSize={24}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar - Tile Selector & Properties */}
      <div className={styles.rightSidebar}>
        <div className={styles.rightSidebarSection}>
          <div className={styles.sectionHeader}>Tile Selector</div>
          <div className={styles.sectionContent}>
            <TileSelector
              selectedTerrain={selectedTerrain}
              onSelectTerrain={setSelectedTerrain}
            />
          </div>
        </div>

        {currentMap && (
          <div className={styles.rightSidebarSection} style={{ flex: 1 }}>
            <div className={styles.sectionHeader}>Map Properties</div>
            <div className={styles.sectionContent}>
              <div style={{ marginBottom: '15px' }}>
                <strong>Name:</strong> {currentMap.name}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Dimensions:</strong> {currentMap.width} x {currentMap.height}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Status:</strong>{' '}
                {currentMap.isPublished ? (
                  <span style={{ color: '#4caf50' }}>Published</span>
                ) : (
                  <span style={{ color: '#ffa726' }}>Draft</span>
                )}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Default Spawn:</strong>{' '}
                {currentMap.isDefaultSpawn ? (
                  <span style={{ color: '#e94560' }}>Yes</span>
                ) : (
                  'No'
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '20px' }}>
                Created: {new Date(currentMap.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Updated: {new Date(currentMap.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#d32f2f',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
