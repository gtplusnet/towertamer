import { Request, Response } from 'express';
import { Map } from '../models/Map';
import { PlayerState } from '../models/PlayerState';
import mongoose from 'mongoose';
import { validateMapImageDimensions } from '../utils/imageValidator';
import { deleteBackgroundImage } from '../middleware/upload.middleware';

/**
 * Helper function to generate slug from map name
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
};

/**
 * Get all maps
 * Public endpoint - returns published maps for non-developers
 * Returns all maps for developers
 */
export const getAllMaps = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is a developer (userId is set by auth middleware if authenticated)
    let isDeveloper = false;
    if (req.userId) {
      const User = mongoose.model('User');
      const user = await User.findById(req.userId);
      isDeveloper = user ? (user as any).isDeveloper : false;
    }

    // Build query based on user role
    const query = isDeveloper ? {} : { isPublished: true };

    // Fetch maps
    const maps = await Map.find(query)
      .select('-tiles') // Exclude tiles array for list view (performance)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        maps,
        count: maps.length,
      },
    });
  } catch (error: any) {
    console.error('Get all maps error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching maps',
      error: error.message,
    });
  }
};

/**
 * Get map by ID
 * Returns full map data including tiles
 */
export const getMapById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid map ID',
      });
      return;
    }

    const map = await Map.findById(id).populate('createdBy', 'username');

    if (!map) {
      res.status(404).json({
        success: false,
        message: 'Map not found',
      });
      return;
    }

    // Check if user has permission to view unpublished maps
    if (!map.isPublished) {
      // Check if user is authenticated and is a developer
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const User = mongoose.model('User');
      const user = await User.findById(req.userId);

      if (!user || !(user as any).isDeveloper) {
        res.status(403).json({
          success: false,
          message: 'Access denied - map is not published',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: { map },
    });
  } catch (error: any) {
    console.error('Get map by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map',
      error: error.message,
    });
  }
};

/**
 * Get default spawn map
 * Public endpoint
 */
export const getDefaultMap = async (_req: Request, res: Response): Promise<void> => {
  try {
    const map = await Map.findOne({ isDefaultSpawn: true }).populate('createdBy', 'username');

    if (!map) {
      res.status(404).json({
        success: false,
        message: 'No default spawn map found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { map },
    });
  } catch (error: any) {
    console.error('Get default map error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching default map',
      error: error.message,
    });
  }
};

/**
 * Create new map
 * Developer only
 */
export const createMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, width, height, tiles, isPublished, isDefaultSpawn } = req.body;

    // Validation
    if (!name || !width || !height || !tiles) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, width, height, and tiles',
      });
      return;
    }

    // Generate slug from name
    let slug = generateSlug(name);

    // Check if slug already exists, append number if needed
    let slugExists = await Map.findOne({ slug });
    let counter = 1;
    const originalSlug = slug;

    while (slugExists) {
      slug = `${originalSlug}-${counter}`;
      slugExists = await Map.findOne({ slug });
      counter++;
    }

    // Create map
    const map = await Map.create({
      name,
      slug,
      width,
      height,
      tiles,
      isPublished: isPublished || false,
      isDefaultSpawn: isDefaultSpawn || false,
      createdBy: req.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Map created successfully',
      data: { map },
    });
  } catch (error: any) {
    console.error('Create map error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error creating map',
      error: error.message,
    });
  }
};

/**
 * Update map
 * Developer only
 */
export const updateMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, width, height, tiles, isPublished, isDefaultSpawn } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid map ID',
      });
      return;
    }

    const map = await Map.findById(id);

    if (!map) {
      res.status(404).json({
        success: false,
        message: 'Map not found',
      });
      return;
    }

    // Update fields
    if (name !== undefined) {
      map.name = name;
      // Regenerate slug if name changed
      const newSlug = generateSlug(name);
      if (newSlug !== map.slug) {
        // Check if new slug already exists
        let slugExists = await Map.findOne({ slug: newSlug, _id: { $ne: id } });
        let counter = 1;
        let finalSlug = newSlug;

        while (slugExists) {
          finalSlug = `${newSlug}-${counter}`;
          slugExists = await Map.findOne({ slug: finalSlug, _id: { $ne: id } });
          counter++;
        }

        map.slug = finalSlug;
      }
    }
    if (width !== undefined) map.width = width;
    if (height !== undefined) map.height = height;
    if (tiles !== undefined) map.tiles = tiles;
    if (isPublished !== undefined) map.isPublished = isPublished;
    if (isDefaultSpawn !== undefined) map.isDefaultSpawn = isDefaultSpawn;

    await map.save();

    res.status(200).json({
      success: true,
      message: 'Map updated successfully',
      data: { map },
    });
  } catch (error: any) {
    console.error('Update map error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error updating map',
      error: error.message,
    });
  }
};

/**
 * Delete map
 * Developer only
 * Cannot delete default spawn map if it's the only one
 */
export const deleteMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid map ID',
      });
      return;
    }

    const map = await Map.findById(id);

    if (!map) {
      res.status(404).json({
        success: false,
        message: 'Map not found',
      });
      return;
    }

    // Prevent deletion of default spawn map if it's the only map
    if (map.isDefaultSpawn) {
      const mapCount = await Map.countDocuments();
      if (mapCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete the only default spawn map',
        });
        return;
      }

      // If deleting default spawn map, set another map as default
      const newDefaultMap = await Map.findOne({ _id: { $ne: id } });
      if (newDefaultMap) {
        newDefaultMap.isDefaultSpawn = true;
        await newDefaultMap.save();
      }
    }

    // Check if any players are currently on this map
    const playersOnMap = await PlayerState.countDocuments({ currentMap: id });
    if (playersOnMap > 0) {
      // Move all players to default spawn map
      const defaultMap = await Map.findOne({ isDefaultSpawn: true });
      if (defaultMap) {
        await PlayerState.updateMany(
          { currentMap: id },
          {
            $set: {
              currentMap: defaultMap._id,
              position: {
                row: parseInt(process.env.DEFAULT_SPAWN_ROW || '10'),
                col: parseInt(process.env.DEFAULT_SPAWN_COL || '15'),
              },
            },
          }
        );
      }
    }

    await Map.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Map deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete map error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting map',
      error: error.message,
    });
  }
};

/**
 * Toggle map publish status
 * Developer only
 */
export const togglePublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid map ID',
      });
      return;
    }

    const map = await Map.findById(id);

    if (!map) {
      res.status(404).json({
        success: false,
        message: 'Map not found',
      });
      return;
    }

    // Toggle publish status
    map.isPublished = !map.isPublished;
    await map.save();

    res.status(200).json({
      success: true,
      message: `Map ${map.isPublished ? 'published' : 'unpublished'} successfully`,
      data: { map },
    });
  } catch (error: any) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling publish status',
      error: error.message,
    });
  }
};

/**
 * Set map as default spawn
 * Developer only
 */
export const setDefaultSpawn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid map ID',
      });
      return;
    }

    const map = await Map.findById(id);

    if (!map) {
      res.status(404).json({
        success: false,
        message: 'Map not found',
      });
      return;
    }

    // Set as default spawn (pre-save hook will unset others)
    map.isDefaultSpawn = true;
    await map.save();

    res.status(200).json({
      success: true,
      message: 'Map set as default spawn successfully',
      data: { map },
    });
  } catch (error: any) {
    console.error('Set default spawn error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default spawn',
      error: error.message,
    });
  }
};

/**
 * Upload background image for a map
 * Developer only
 * Validates image dimensions match map size (width × 24px, height × 24px)
 */
export const uploadBackgroundImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid map ID',
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
      return;
    }

    const map = await Map.findById(id);

    if (!map) {
      // Delete uploaded file if map not found
      await deleteBackgroundImage(req.file.filename);
      res.status(404).json({
        success: false,
        message: 'Map not found',
      });
      return;
    }

    // Validate image dimensions
    const validation = await validateMapImageDimensions(
      req.file.path,
      map.width,
      map.height
    );

    if (!validation.valid) {
      // Delete uploaded file if validation fails
      await deleteBackgroundImage(req.file.filename);
      res.status(400).json({
        success: false,
        message: validation.error,
      });
      return;
    }

    // Delete old background image if exists
    if (map.backgroundImage) {
      await deleteBackgroundImage(map.backgroundImage);
    }

    // Update map with new background image path
    map.backgroundImage = `/uploads/maps/${req.file.filename}`;
    await map.save();

    res.status(200).json({
      success: true,
      message: 'Background image uploaded successfully',
      data: {
        map,
        imageUrl: map.backgroundImage,
      },
    });
  } catch (error: any) {
    console.error('Upload background image error:', error);

    // Try to delete uploaded file on error
    if (req.file) {
      await deleteBackgroundImage(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading background image',
      error: error.message,
    });
  }
};
