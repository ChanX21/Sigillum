import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

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
  vector: number[];
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
  processingId: string;
  vector: number[];
  watermarkData: string;
  watermarkedBuffer: Buffer;
  createdAt: number;
  authenticatedAt: string;
  verificationData: VerificationData;
  signature: string;
}

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
): Promise<{ watermarkedBuffer: Buffer; watermarkData: string; createdAt: string; authenticatedAt: string }> => {
  try {
    // Generate unique identifiers
    const timestamp = new Date().toISOString();
    
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
 * Get the vector of an image
 * @param imageBuffer - Buffer of the original image
 * @returns Vector of the image
 */
export const getImageVector = async (imageBuffer: Buffer): Promise<number[]> => {
  const vectorResponse = await axios.post(`${process.env.EMBEDDING_URL}/get_image_embedding`, { image: imageBuffer.toString('base64') }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return vectorResponse.data.embedding;
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
    const vector = await getImageVector(imageBuffer);
    // Create watermark data
    const watermarkData = JSON.stringify({
      creator: options.creatorId || 'Sigillum',
      timestamp: processingTimestamp,
      id: processingId,
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
      vector: vector,
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
      fileName: `watermarked_${processingId}.png`,
      originalBufferSize: imageBuffer.length,
      outputFormat: 'png',
      vector: vector,
      processingId,
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
  processImageForAuthentication
}; 