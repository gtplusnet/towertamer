import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isValidImageFormat } from '../utils/imageValidator';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/maps');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: mapId_timestamp.ext
    const mapId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${mapId}_${timestamp}${ext}`);
  },
});

// File filter to only accept images
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (isValidImageFormat(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, and JPEG images are allowed'));
  }
};

// Configure multer
export const uploadMapBackground = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (no strict limit per requirements, but set reasonable limit)
  },
});

/**
 * Helper function to delete an old background image file
 * @param filename Filename or full path to delete
 */
export async function deleteBackgroundImage(filename: string): Promise<void> {
  try {
    // Extract just the filename if a full path was provided
    const basename = path.basename(filename);
    const filePath = path.join(uploadsDir, basename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting background image:', error);
    // Don't throw - failing to delete old file shouldn't break the upload
  }
}
