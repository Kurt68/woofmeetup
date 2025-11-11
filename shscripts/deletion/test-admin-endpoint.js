/**
 * Test script for the secured scheduled deletion endpoint
 *
 * This script helps verify that all security middleware is working correctly.
 * Run with: node test-admin-endpoint.js
 */

import fetch from 'node-fetch'

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000'
const ENDPOINT = '/api/auth/trigger-scheduled-deletion'

console.log('🧪 Testing Scheduled Deletion Endpoint Security\n')
console.log(`Base URL: ${BASE_URL}`)
console.log(`Endpoint: ${ENDPOINT}\n`)

// Test 1: No authentication
async function testNoAuth() {
  console.log('Test 1: Request without authentication')
  try {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'POST',
    })
    const data = await response.json()

    if (response.status === 401) {
      console.log('✅ PASS: Returns 401 Unauthorized')
      console.log(`   Message: ${data.message}\n`)
    } else {
      console.log(`❌ FAIL: Expected 401, got ${response.status}`)
      console.log(`   Response: ${JSON.stringify(data)}\n`)
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`)
  }
}

// Test 2: With authentication but not admin (requires manual token)
async function testNonAdminAuth(token) {
  if (!token) {
    console.log('Test 2: Skipped (no token provided)')
    console.log('   To test: node test-admin-endpoint.js YOUR_JWT_TOKEN\n')
    return
  }

  console.log('Test 2: Request with non-admin user token')
  try {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Cookie': `token=${token}`,
      },
    })
    const data = await response.json()

    if (response.status === 403) {
      console.log('✅ PASS: Returns 403 Forbidden (non-admin user)')
      console.log(`   Message: ${data.message}\n`)
    } else if (response.status === 200) {
      console.log('⚠️  WARNING: User appears to be admin')
      console.log('   This test requires a non-admin user token\n')
    } else {
      console.log(`❌ FAIL: Expected 403, got ${response.status}`)
      console.log(`   Response: ${JSON.stringify(data)}\n`)
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`)
  }
}

// Test 3: Rate limiting (requires admin token)
async function testRateLimit(token) {
  if (!token) {
    console.log('Test 3: Skipped (no admin token provided)\n')
    return
  }

  console.log('Test 3: Rate limiting (making 4 requests rapidly)')
  console.log('   Note: This will consume your rate limit!\n')

  for (let i = 1; i <= 4; i++) {
    try {
      const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Cookie': `token=${token}`,
        },
      })
      const data = await response.json()

      console.log(
        `   Request ${i}: ${response.status} - ${data.message || data.success}`
      )

      if (response.status === 429) {
        console.log(
          '✅ PASS: Rate limiting is working (429 after 3 requests)\n'
        )
        break
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.log(`   Request ${i}: ERROR - ${error.message}`)
    }
  }
}

// Summary
function printSummary() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('Summary of Security Features:')
  console.log('═══════════════════════════════════════════════════════')
  console.log('✅ Authentication (verifyToken)')
  console.log('✅ Admin Role Check (checkAdminRole)')
  console.log('✅ Rate Limiting (deletionEndpointLimiter)')
  console.log('')
  console.log('Configuration:')
  console.log('  - Rate Limit: 3 requests per hour per IP')
  console.log('  - Admin Only: isAdmin: true required')
  console.log('  - Auth Method: JWT token in cookie')
  console.log('═══════════════════════════════════════════════════════\n')
}

// Run tests
async function runTests() {
  const token = process.argv[2] // Get token from command line argument

  printSummary()

  await testNoAuth()
  await testNonAdminAuth(token)

  if (token) {
    const shouldTestRateLimit = process.argv[3] === '--test-rate-limit'
    if (shouldTestRateLimit) {
      await testRateLimit(token)
    } else {
      console.log('Test 3: Rate limiting test skipped')
      console.log(
        '   To test: node test-admin-endpoint.js TOKEN --test-rate-limit'
      )
      console.log('   ⚠️  Warning: This will consume your rate limit!\n')
    }
  }

  console.log('Testing complete! 🎉')
  console.log('\nNext steps:')
  console.log('1. Set a user as admin: See ADMIN_QUICK_START.md')
  console.log('2. Log in and get JWT token from browser cookies')
  console.log(
    '3. Test with admin token: node test-admin-endpoint.js YOUR_TOKEN'
  )
}

runTests().catch(console.error)
