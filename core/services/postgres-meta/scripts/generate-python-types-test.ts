#!/usr/bin/env node

/**
 * Script to generate Python types for CI validation
 * This script uses the test database setup to generate Python types
 */

import { build } from '../src/server/app.js'

const TEST_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432'

async function generatePythonTypes() {
  const app = build()
  
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/generators/python',
      headers: {
        pg: TEST_CONNECTION_STRING,
      },
      query: {
        access_control: 'public',
      },
    })

    if (response.statusCode !== 200) {
      console.error(`Failed to generate types: ${response.statusCode}`)
      console.error(response.body)
      process.exit(1)
    }

    // Write to stdout so it can be captured
    process.stdout.write(response.body)
  } catch (error) {
    console.error('Error generating Python types:', error)
    process.exit(1)
  } finally {
    await app.close()
  }
}

generatePythonTypes()

