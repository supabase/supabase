/**
 * Simple script to test CMS API connectivity
 * Run with: node scripts/test-cms-api.js
 */

// You may need to install node-fetch if running outside Next.js
// const fetch = require('node-fetch');

const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:1337'

async function testCmsApi() {
  console.log('Testing CMS API connectivity...')
  console.log('CMS API URL:', CMS_API_URL)

  try {
    // Test API endpoint
    const response = await fetch(`${CMS_API_URL}/api/blog-posts?populate=*&pagination[pageSize]=1`)

    console.log('Response status:', response.status, response.statusText)

    if (!response.ok) {
      console.error('Error connecting to CMS API')
      return
    }

    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))

    if (data.data && data.data.length > 0) {
      console.log('Successfully retrieved posts from CMS')
      console.log('First post title:', data.data[0].Title)
      console.log('First post structure:', Object.keys(data.data[0]))
    } else {
      console.log('No posts found in CMS')
    }
  } catch (error) {
    console.error('Error testing CMS API:', error)
  }
}

testCmsApi()
