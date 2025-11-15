import sharp from 'sharp';

const TILE_SIZE = 24; // pixels

export interface ImageValidationResult {
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Validates that an uploaded image has the correct dimensions for a map
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
