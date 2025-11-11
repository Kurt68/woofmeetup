/**
 * Test script for OpenAI Vision API nudity detection
 *
 * Usage:
 *   node test-openai-detection.js
 *
 * Make sure OPENAI_API_KEY is set in .env before running
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { checkImage, preloadModel } from './server/utilities/checkImage.js'

async function main() {
  console.log('🔍 OpenAI Vision API Nudity Detection Test\n')

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in .env file')
    console.error('   Add your OpenAI API key to .env:')
    console.error('   OPENAI_API_KEY=sk_...')
    process.exit(1)
  }

  console.log('✓ OpenAI API key found')

  try {
    // Initialize the model
    console.log('\n📦 Initializing OpenAI Vision API...')
    await preloadModel()
    console.log('✓ Initialized successfully\n')
  } catch (error) {
    console.error('❌ Initialization failed:', error.message)
    process.exit(1)
  }

  // Test with a sample image if available
  const testImagePath = path.join(
    process.cwd(),
    'shscripts/test-images/profiles'
  )

  if (!fs.existsSync(testImagePath)) {
    console.log('ℹ️  No test images found at', testImagePath)
    console.log(
      '   To test with real images, add some dog profile images to that directory\n'
    )

    // Create a simple test with a placeholder
    console.log('💾 Creating a simple test placeholder...')
    try {
      // Create a small valid JPEG buffer
      const placeholderBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ])

      console.log('\n🧪 Testing with placeholder JPEG...')
      const result = await checkImage(placeholderBuffer)
      console.log('✓ Detection completed')
      console.log('Result:', JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('❌ Test failed:', error.message)
      console.error('\nNote: The test placeholder is too small to be useful.')
      console.error(
        'For real testing, add dog profile images to:',
        testImagePath
      )
    }
  } else {
    console.log('📁 Found test images directory, analyzing samples...\n')

    const files = fs
      .readdirSync(testImagePath)
      .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
      .slice(0, 2) // Test with first 2 images

    if (files.length === 0) {
      console.log('   No image files found in', testImagePath)
    } else {
      for (const file of files) {
        const filePath = path.join(testImagePath, file)
        console.log(`\n🧪 Testing: ${file}`)

        try {
          const imageBuffer = fs.readFileSync(filePath)
          const result = await checkImage(imageBuffer)

          console.log('✓ Analysis completed')
          console.log(`  Inappropriate: ${result.isNude}`)
          console.log(`  Dog Detected: ${result.isDog}`)
          if (result.dogBreeds && result.dogBreeds.length > 0) {
            console.log(
              `  Breed(s): ${result.dogBreeds
                .map(
                  (b) => `${b.className} (${(b.probability * 100).toFixed(0)}%)`
                )
                .join(', ')}`
            )
          }
          console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`)
          console.log(`  Reason: ${result.reason}`)
        } catch (error) {
          console.error(`❌ Analysis failed: ${error.message}`)
        }
      }
    }
  }

  console.log('\n✅ Test complete!')
  console.log('\nNext steps:')
  console.log('1. Verify OPENAI_API_KEY is set correctly in .env')
  console.log('2. Run: npm run server')
  console.log('3. The detection will work automatically on image uploads')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
