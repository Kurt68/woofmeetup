import OpenAI from 'openai'
import { logError, logInfo, logWarning } from './logger.js'
import AppError from './AppError.js'
import { ErrorCodes } from '../constants/errorCodes.js'

let openai

/**
 * Initialize OpenAI client
 */
export async function preloadModel() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw AppError.internalError(ErrorCodes.EXTERNAL_SERVICE_ERROR, {
        service: 'OpenAI',
        reason: 'API key not configured',
      })
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout for API calls
      maxRetries: 2, // Retry up to 2 times on failure
    })

    logInfo('checkImage', '✓ OpenAI Vision API ready for image analysis')
  } catch (error) {
    logError('checkImage', 'OpenAI initialization failed', error)
    throw error
  }
}

/**
 * Check image for nudity and dog content using OpenAI's Vision API
 * Returns detailed classification results with confidence scores
 * @param {Buffer} imageBuffer - Image buffer to check
 * @returns {Promise<{isNude: boolean, isDog: boolean, dogBreeds: Array, confidence: number, reason: string}>}
 */
export async function checkImage(imageBuffer) {
  try {
    if (!openai) {
      throw AppError.internalError(ErrorCodes.EXTERNAL_SERVICE_ERROR, {
        service: 'OpenAI',
        reason: 'Client not initialized',
      })
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64')

    logInfo('checkImage', 'Analyzing image for content and dog classification...')

    // Use OpenAI Vision API to check for inappropriate content and identify dogs
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: `Analyze this image for:
1. Nudity or explicit sexual content
2. Whether it contains a dog (or multiple dogs)
3. If dog(s) detected, identify the breed(s) with confidence

For a family-friendly dog dating app, determine:
- If this image is appropriate (no nudity/explicit content)
- What dog breed(s) are in the image (if any)
- Confidence level for each breed detection

Consider common dog breeds: labrador, golden_retriever, german_shepherd, bulldog, poodle, husky, beagle, dachshund, french_bulldog, corgi, etc.

Respond ONLY with a JSON object in this exact format:
{
  "isInappropriate": boolean,
  "isDog": boolean,
  "dogBreeds": [
    {
      "className": "breed_name_lowercase",
      "probability": 0.95
    }
  ],
  "confidence": number (0.0 to 1.0),
  "reason": "brief explanation"
}

Rules:
- If NO dogs detected, set isDog to false and dogBreeds to []
- If dogs detected, list TOP 3 most likely breeds with probabilities
- Probabilities should sum to approximately 1.0
- Confidence is your certainty about the nudity check (not breed detection)`,
            },
          ],
        },
      ],
      max_completion_tokens: 200,
    })

    // Parse the response
    const content = response.choices[0].message.content
    logInfo('checkImage', 'OpenAI response received')

    if (!content) {
      throw AppError.internalError(ErrorCodes.EXTERNAL_SERVICE_ERROR, {
        service: 'OpenAI Vision',
        reason: 'Empty response from API',
      })
    }

    let result
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw AppError.internalError(ErrorCodes.EXTERNAL_SERVICE_ERROR, {
          service: 'OpenAI Vision',
          reason: 'Invalid response format - no JSON found',
        })
      }
      result = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      logError('checkImage', 'Failed to parse OpenAI response', parseError, {
        content,
      })
      // If we can't parse, default to allowing the image
      return {
        isNude: false,
        isDog: false,
        dogBreeds: [],
        confidence: 0,
        reason: 'Could not analyze image',
      }
    }

    const isNude = result.isInappropriate || false
    const isDog = result.isDog || false
    const dogBreeds = Array.isArray(result.dogBreeds) ? result.dogBreeds : []
    const confidence = result.confidence || 0
    const reason = result.reason || 'No issues detected'

    if (isNude) {
      logInfo(
        'checkImage',
        `⚠️ Inappropriate content detected! Confidence: ${(confidence * 100).toFixed(
          1
        )}% - ${reason}`
      )
    } else if (isDog) {
      logInfo(
        'checkImage',
        `✓ Dog(s) detected: ${dogBreeds
          .map((d) => `${d.className} (${(d.probability * 100).toFixed(0)}%)`)
          .join(', ')}`
      )
    } else {
      logInfo('checkImage', '✓ Image analyzed - no dogs or inappropriate content detected')
    }

    return {
      isNude,
      isDog,
      dogBreeds,
      confidence,
      reason,
    }
  } catch (error) {
    logError('checkImage', 'Error during image analysis with OpenAI', error)

    // Allow upload with warning if detection fails
    logWarning('checkImage', 'Image analysis check failed, allowing upload with warning')
    return {
      isNude: false,
      isDog: false,
      dogBreeds: [],
      confidence: 0,
      reason: 'Detection service unavailable',
    }
  }
}

/**
 * Cleanup - OpenAI doesn't need cleanup
 */
export function cleanupModel() {
  // No cleanup needed for OpenAI API
  logInfo('checkImage', '✓ OpenAI image analysis cleanup complete')
}
