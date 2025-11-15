import sharp from 'sharp';
import fs from 'fs/promises';

const TILE_SIZE = 24; // pixels
const ASPECT_RATIO_TOLERANCE = 0.05; // 5% tolerance for aspect ratio matching

export interface ImageValidationResult {
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Validates aspect ratio and processes (resizes + optimizes) an uploaded image for a map
 * @param inputPath Path to the uploaded image file
 * @param outputPath Path where the processed image should be saved
 * @param expectedWidth Expected map width in tiles
 * @param expectedHeight Expected map height in tiles
 * @returns Validation result with dimensions or error message
 */
export async function validateAndProcessMapImage(
  inputPath: string,
  outputPath: string,
  expectedWidth: number,
  expectedHeight: number
): Promise<ImageValidationResult> {
  try {
    // Get image metadata using sharp
    const metadata = await sharp(inputPath).metadata();

    if (!metadata.width || !metadata.height) {
      // Clean up uploaded file
      await fs.unlink(inputPath).catch(() => {});
      return {
        valid: false,
        error: 'Unable to read image dimensions',
      };
    }

    // Calculate aspect ratios
    const imageAspectRatio = metadata.width / metadata.height;
    const mapAspectRatio = expectedWidth / expectedHeight;
    const aspectRatioDifference = Math.abs(imageAspectRatio - mapAspectRatio) / mapAspectRatio;

    // Check if aspect ratios match within tolerance
    if (aspectRatioDifference > ASPECT_RATIO_TOLERANCE) {
      // Clean up uploaded file
      await fs.unlink(inputPath).catch(() => {});

      // Calculate example dimensions for helpful error message
      const exampleWidth1 = 1200;
      const exampleHeight1 = Math.round(1200 * (expectedHeight / expectedWidth));
      const exampleWidth2 = 2400;
      const exampleHeight2 = Math.round(2400 * (expectedHeight / expectedWidth));

      return {
        valid: false,
        width: metadata.width,
        height: metadata.height,
        error: `Image aspect ratio (${metadata.width}×${metadata.height}) does not match the map aspect ratio. For a ${expectedWidth}×${expectedHeight} tile map, please upload an image with ${expectedWidth}:${expectedHeight} aspect ratio (e.g., ${exampleWidth1}×${exampleHeight1}px, ${exampleWidth2}×${exampleHeight2}px, or any size with that ratio).`,
      };
    }

    // Calculate target dimensions
    const targetWidth = expectedWidth * TILE_SIZE;
    const targetHeight = expectedHeight * TILE_SIZE;

    // Resize and convert to WebP
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        fit: 'fill', // Force exact dimensions
        kernel: 'lanczos3', // High-quality resizing algorithm
      })
      .webp({
        quality: 88, // High quality WebP
        effort: 6, // Higher compression effort (0-6, 6 is best)
      })
      .toFile(outputPath);

    // Delete original uploaded file
    await fs.unlink(inputPath).catch(() => {});

    return {
      valid: true,
      width: targetWidth,
      height: targetHeight,
    };
  } catch (error: any) {
    // Clean up uploaded file on error
    await fs.unlink(inputPath).catch(() => {});
    return {
      valid: false,
      error: `Error processing image: ${error.message}`,
    };
  }
}

/**
 * Legacy function - validates that an uploaded image has the correct dimensions for a map
 * @deprecated Use validateAndProcessMapImage instead
 * @param filePath Path to the uploaded image file
 * @param expectedWidth Expected map width in tiles
 * @param expectedHeight Expected map height in tiles
 * @returns Validation result with dimensions or error message
 */
export async function validateMapImageDimensions(
  filePath: string,
  expectedWidth: number,
  expectedHeight: number
): Promise<ImageValidationResult> {
  try {
    // Get image metadata using sharp
    const metadata = await sharp(filePath).metadata();

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Unable to read image dimensions',
      };
    }

    const expectedPixelWidth = expectedWidth * TILE_SIZE;
    const expectedPixelHeight = expectedHeight * TILE_SIZE;

    // Check if dimensions match exactly
    if (metadata.width !== expectedPixelWidth || metadata.height !== expectedPixelHeight) {
      return {
        valid: false,
        width: metadata.width,
        height: metadata.height,
        error: `Image dimensions (${metadata.width}×${metadata.height}px) do not match map dimensions (${expectedPixelWidth}×${expectedPixelHeight}px). Expected ${expectedWidth}×${expectedHeight} tiles at ${TILE_SIZE}px each.`,
      };
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Error reading image: ${error.message}`,
    };
  }
}

/**
 * Validates that a file is a valid image format
 * @param mimeType MIME type of the uploaded file
 * @returns True if the file is a supported image format
 */
export function isValidImageFormat(mimeType: string): boolean {
  const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
  return validFormats.includes(mimeType.toLowerCase());
}
