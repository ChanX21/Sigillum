import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Type definitions
interface HashOptions {
  encoding?: 'hex' | 'base64' | 'binary';
}

interface PerceptualHashOptions {
  size?: number;
  highPrecision?: boolean;
}

interface PerceptualHashResult {
  hash: string;
  algorithm: string;
  bits: number;
  timestamp: number;
}

interface WatermarkOptions {
  creatorId?: string;
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

interface WatermarkResult {
  path: string;
  watermarkData: string;
  timestamp: number;
  uniqueId: string;
  format: string;
}

interface VerificationData {
  id: string;
  originalHash: string;
  pHash: string;
  hashAlgorithm: string;
  pHashAlgorithm: string;
  pHashBits: number;
  watermarkId: string;
  creatorId: string;
  timestamp: number;
  authenticatedAt: string;
}

interface AuthenticationOptions {
  highPrecision?: boolean;
  creatorId?: string;
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

interface AuthenticationResult {
  fileName: string;
  originalBufferSize: number;
  outputFormat: string;
  sha256Hash: string;
  shortHash: string;
  pHash: string;
  processingId: string;
  pHashMetadata: {
    algorithm: string;
    bits: number;
    computedAt: number;
  };
  watermarkData: string;
  watermarkedBuffer: Buffer;
  createdAt: number;
  authenticatedAt: string;
  verificationData: VerificationData;
  signature: string;
}

/**
 * Generate SHA-256 hash for an image file
 * @param imageBuffer - The image buffer
 * @param options - Hash options
 * @returns The SHA-256 hash
 * @throws Error If hashing fails
 */
const generateSHA256Hash = (imageBuffer: Buffer, options: HashOptions = {}): string => {
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new TypeError('Expected an image Buffer');
  }
  
  if (imageBuffer.length === 0) {
    throw new Error('Empty image buffer provided');
  }
  
  try {
    const encoding = options.encoding || 'hex';
    const validEncodings = ['hex', 'base64', 'binary'];
    
    if (!validEncodings.includes(encoding)) {
      throw new Error(`Invalid encoding: ${encoding}. Must be one of: ${validEncodings.join(', ')}`);
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(imageBuffer);
    return hash.digest(encoding as crypto.BinaryToTextEncoding);
  } catch (error) {
    console.error('SHA-256 hash generation error:', error);
    throw new Error(`Failed to compute SHA-256 hash: ${(error as Error).message}`);
  }
};

/**
 * Generate a perceptual hash using a robust algorithm suited for production use.
 * This implementation uses a combination of image preprocessing and average hashing
 * to create a fingerprint that is resistant to minor modifications.
 * 
 * @param imageBuffer - Input image buffer
 * @param options - Configuration options
 * @returns Hash object with metadata
 * @throws Error If image processing fails
 */
const generatePerceptualHash = async (
  imageBuffer: Buffer, 
  options: PerceptualHashOptions = {}
): Promise<PerceptualHashResult> => {
  // Input validation
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new TypeError('Expected an image Buffer');
  }
  
  if (imageBuffer.length === 0) {
    throw new Error('Empty image buffer provided');
  }

  // Configuration with sensible defaults
  const size = options.highPrecision ? 16 : 8;
  const hashSize = options.highPrecision ? 256 : 64;
  const algorithm = options.highPrecision ? 'aHash-256' : 'aHash-64';

  try {
    // Step 1: Advanced preprocessing - normalize the image using sharp's pipeline
    const raw = await sharp(imageBuffer)
      .normalize() // Enhance contrast
      .greyscale() // Ensure grayscale consistency
      .resize(size, size, { 
        fit: 'fill', 
        kernel: 'lanczos3' // High-quality resampling
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Step 2: Extract pixel data
    const { data: pixels, info } = raw;
    
    if (pixels.length !== size * size) {
      throw new Error(`Unexpected pixel data length: ${pixels.length} (expected ${size * size})`);
    }

    // Step 3: Calculate median for better robustness against outliers
    const sortedPixels = Buffer.from(pixels).sort();
    const median = sortedPixels[Math.floor(sortedPixels.length / 2)];

    // Step 4: Generate hash based on comparison to median
    let binaryHash = '';
    for (let i = 0; i < pixels.length; i++) {
      binaryHash += pixels[i] >= median ? '1' : '0';
    }

    // Step 5: Convert binary to hex with validation
    let hex = '';
    for (let i = 0; i < binaryHash.length; i += 4) {
      if (i + 4 <= binaryHash.length) {
        const nibble = binaryHash.slice(i, i + 4);
        hex += parseInt(nibble, 2).toString(16);
      }
    }

    // Validate expected length
    const expectedHexLength = hashSize / 4;
    if (hex.length !== expectedHexLength) {
      throw new Error(`Generated hash has unexpected length: ${hex.length} (expected ${expectedHexLength})`);
    }

    return {
      hash: hex,
      algorithm,
      bits: hashSize,
      timestamp: Date.now()
    };
  } catch (err) {
    console.error('Perceptual hash generation error:', err);
    if ((err as Error).message.includes('Input buffer contains unsupported image format')) {
      throw new Error('Unsupported image format. Please provide a valid image file.');
    }
    throw new Error(`Failed to compute perceptual hash: ${(err as Error).message}`);
  }
};

/**
 * Add an invisible watermark to an image with creator ID and timestamp
 * @param imageBuffer - Buffer of the original image
 * @param options - Watermark options
 * @returns Watermark result
 */
export const addWatermark = async (
  imageBuffer: Buffer,
  watermarkData: string,
  creatorId: string
): Promise<{ watermarkedBuffer: Buffer; sha256Hash: string; pHash: string; watermarkData: string; createdAt: string; authenticatedAt: string }> => {
  try {
    // Generate unique identifiers
    const timestamp = new Date().toISOString();
    const sha256Hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    const pHash = await generatePerceptualHash(imageBuffer);
    
    // Generate watermarked image buffer
    const watermarkedBuffer = await sharp(imageBuffer)
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: `${creatorId} | ${timestamp}`,
            ImageDescription: 'Authenticated with Sigillum',
            Software: 'Sigillum Authentication'
          }
        }
      })
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        comment: watermarkData
      } as sharp.PngOptions & { comment: string })
      .toBuffer();

    return {
      watermarkedBuffer,
      sha256Hash,
      pHash: pHash.hash,
      watermarkData,
      createdAt: timestamp,
      authenticatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw new Error(`Watermarking failed: ${(error as Error).message}`);
  }
};

/**
 * Process an image for blockchain authentication
 * @param imageBuffer - Buffer of the original image
 * @param options - Authentication options
 * @returns Authentication data for blockchain storage
 * @throws Error If processing fails
 */
const processImageForAuthentication = async (
  imageBuffer: Buffer, 
  options: AuthenticationOptions = {}
): Promise<AuthenticationResult> => {
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new TypeError('Expected an image Buffer');
  }
  
  try {
    // Generate security artifact identifiers
    const processingId = crypto.randomBytes(12).toString('hex');
    const processingTimestamp = Date.now();
    
    // Generate SHA-256 hash
    const sha256Hash = generateSHA256Hash(imageBuffer);
    const shortHash = sha256Hash.substring(0, 16);
    
    // Generate perceptual hash
    const pHashResult = await generatePerceptualHash(imageBuffer, {
      highPrecision: options.highPrecision || false
    });
    
    // Create watermark data
    const watermarkData = JSON.stringify({
      creator: options.creatorId || 'Sigillum',
      timestamp: processingTimestamp,
      id: processingId,
      originalHash: shortHash,
      version: '1.0'
    });
    
    // Add watermark
    const watermarkResult = await addWatermark(
      imageBuffer,
      watermarkData,
      options.creatorId || 'Sigillum'
    );
    
    // Create verification data structure for blockchain storage
    const verificationData: VerificationData = {
      id: processingId,
      originalHash: sha256Hash,
      pHash: pHashResult.hash,
      hashAlgorithm: 'SHA-256',
      pHashAlgorithm: pHashResult.algorithm,
      pHashBits: pHashResult.bits,
      watermarkId: processingId,
      creatorId: options.creatorId || 'Sigillum',
      timestamp: processingTimestamp,
      authenticatedAt: new Date().toISOString()
    };
    
    // Sign verification data
    const signature = crypto
      .createHmac('sha256', process.env.SIGNATURE_SECRET || 'sigillum-verification-secret')
      .update(JSON.stringify(verificationData))
      .digest('hex');
    
    return {
      fileName: `watermarked_${sha256Hash}.png`,
      originalBufferSize: imageBuffer.length,
      outputFormat: 'png',
      sha256Hash,
      shortHash,
      pHash: pHashResult.hash,
      processingId,
      pHashMetadata: {
        algorithm: pHashResult.algorithm,
        bits: pHashResult.bits,
        computedAt: pHashResult.timestamp
      },
      watermarkData: watermarkResult.watermarkData,
      watermarkedBuffer: watermarkResult.watermarkedBuffer,
      createdAt: processingTimestamp,
      authenticatedAt: new Date().toISOString(),
      verificationData,
      signature
    };
  } catch (error) {
    console.error('Error processing image for authentication:', error);
    throw new Error(`Image authentication failed: ${(error as Error).message}`);
  }
};

export {
  generateSHA256Hash,
  generatePerceptualHash,
  processImageForAuthentication
}; 