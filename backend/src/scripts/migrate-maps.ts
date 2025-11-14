import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { Map as MapModel } from '../models/Map';
import { PlayerState } from '../models/PlayerState';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Map file definitions
const MAP_FILES = [
  { filename: 'map01.json', slug: 'grassland-village', isDefault: true },
  { filename: 'map02.json', slug: 'test-chamber', isDefault: false },
  { filename: 'map03.json', slug: 'map03', isDefault: false },
  { filename: 'map04.json', slug: 'map04', isDefault: false },
];

interface PortalData {
  targetMap: string; // File path in old system
  targetPosition: { row: number; col: number };
}

interface Tile {
  terrain: string;
  walkable: boolean;
  portalData?: PortalData;
}

interface MapJson {
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
}

async function migrateMap(filename: string, slug: string, isDefault: boolean) {
  // Read map JSON file
  const mapPath = path.join(
    __dirname,
    '../../../frontend/src/data/maps',
    filename
  );

  console.log(`📄 Reading map file: ${mapPath}`);

  if (!fs.existsSync(mapPath)) {
    console.warn(`⚠️  Map file not found: ${mapPath}, skipping...`);
    return null;
  }

  const mapData: MapJson = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

  console.log(`📦 Processing map: ${mapData.name} (${filename})`);

  // Store original portal data for second pass
  const portalDataMap: Map<string, PortalData> = new Map();

  // Strip portal data from tiles (will be added back in second pass)
  const tilesWithoutPortalData = mapData.tiles.map((row, rowIndex) =>
    row.map((tile, colIndex) => {
      if (tile.terrain === 'portal' && tile.portalData) {
        // Store original portal data
        const key = `${rowIndex},${colIndex}`;
        portalDataMap.set(key, tile.portalData);

        // Return tile without portal data
        return {
          terrain: tile.terrain,
          walkable: tile.walkable,
        };
      }
      return tile;
    })
  );

  // Create map document (portals will be updated in second pass)
  const map = await MapModel.create({
    name: mapData.name,
    slug,
    width: mapData.width,
    height: mapData.height,
    tiles: tilesWithoutPortalData,
    isPublished: true, // All existing maps are published by default
    isDefaultSpawn: isDefault,
    createdBy: null, // No creator for migrated maps
  });

  console.log(`✅ Created map: ${mapData.name} (ID: ${map._id})`);

  return {
    filename,
    mapId: map._id,
    map,
    portalDataMap,
  };
}

async function updatePortalReferences(
  mapIdMapping: Map<string, mongoose.Types.ObjectId>,
  mapFilenameMapping: Map<string, string> // slug -> filename mapping
) {
  console.log('\n🔗 Updating portal references...');

  const maps = await MapModel.find({});

  for (const map of maps) {
    // Find the original filename for this map
    let originalFilename: string | undefined;
    for (const [slug, filename] of mapFilenameMapping.entries()) {
      if (map.slug === slug) {
        originalFilename = filename;
        break;
      }
    }

    if (!originalFilename) {
      console.warn(`⚠️  Could not find original file for map: ${map.name}`);
      continue;
    }

    // Re-read original JSON to get portal data
    const mapPath = path.join(
      __dirname,
      '../../../frontend/src/data/maps',
      originalFilename
    );

    if (!fs.existsSync(mapPath)) {
      console.warn(`⚠️  Original map file not found: ${mapPath}`);
      continue;
    }

    const originalMapData: MapJson = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    let updatedCount = 0;

    // Update portal tiles with correct targetMapId
    for (let row = 0; row < originalMapData.tiles.length; row++) {
      for (let col = 0; col < originalMapData.tiles[row].length; col++) {
        const originalTile = originalMapData.tiles[row][col];

        if (originalTile.terrain === 'portal' && originalTile.portalData) {
          // Extract target filename from path
          const targetMapPath = originalTile.portalData.targetMap;
          const targetFilename = path.basename(targetMapPath);
          const targetMapId = mapIdMapping.get(targetFilename);

          if (targetMapId) {
            // Update the tile in the database map
            map.tiles[row][col].portalData = {
              targetMapId: targetMapId,
              targetPosition: originalTile.portalData.targetPosition,
            } as any;
            updatedCount++;
          } else {
            console.warn(
              `⚠️  Warning: Portal in ${map.name} at (${row},${col}) references unknown map: ${targetFilename}`
            );
          }
        }
      }
    }

    if (updatedCount > 0) {
      // Mark tiles as modified to ensure Mongoose saves nested changes
      map.markModified('tiles');
      await map.save();
      console.log(
        `  ✅ Updated ${updatedCount} portal(s) in map: ${map.name}`
      );
    }
  }
}

async function updatePlayerStates(defaultMapId: mongoose.Types.ObjectId) {
  console.log('\n👥 Updating player states...');

  // Update all player states to use the new default map ObjectId
  const result = await PlayerState.updateMany(
    {},
    {
      $set: {
        currentMap: defaultMapId,
      },
    }
  );

  console.log(`  ✅ Updated ${result.modifiedCount} player state(s)`);
}

async function migrate() {
  try {
    console.log('');
    console.log('========================================');
    console.log('🗺️  Tower Tamer - Map Migration Script');
    console.log('========================================');
    console.log('');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if maps already exist
    const existingMaps = await MapModel.countDocuments();
    if (existingMaps > 0) {
      console.log(`⚠️  Warning: Database already contains ${existingMaps} map(s)`);
      console.log('   This script will add new maps and may create duplicates.');
      console.log('');

      // Uncomment the following lines to prevent re-running migration
      // console.log('❌ Migration aborted to prevent duplicates');
      // process.exit(1);
    }

    // First pass: Create all maps
    console.log('📦 Creating maps...\n');

    const mapIdMapping = new Map<string, mongoose.Types.ObjectId>();
    const mapFilenameMapping = new Map<string, string>(); // slug -> filename
    let defaultMapId: mongoose.Types.ObjectId | null = null;

    for (const { filename, slug, isDefault } of MAP_FILES) {
      const result = await migrateMap(filename, slug, isDefault);
      if (result) {
        mapIdMapping.set(result.filename, result.mapId);
        mapFilenameMapping.set(slug, filename);
        if (isDefault) {
          defaultMapId = result.mapId;
        }
      }
    }

    console.log(`\n✅ Created ${mapIdMapping.size} map(s)`);

    // Second pass: Update portal references
    if (mapIdMapping.size > 0) {
      await updatePortalReferences(mapIdMapping, mapFilenameMapping);
    }

    // Update player states
    if (defaultMapId) {
      await updatePlayerStates(defaultMapId);
    }

    console.log('');
    console.log('========================================');
    console.log('✅ Migration completed successfully!');
    console.log('========================================');
    console.log('');

    // Summary
    console.log('Summary:');
    console.log(`  - Maps created: ${mapIdMapping.size}`);
    console.log(`  - Default spawn map: ${MAP_FILES.find((m) => m.isDefault)?.slug}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
