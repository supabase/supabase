import { enableFetchMocks } from 'jest-fetch-mock'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'

enableFetchMocks()

fetch.mockResponse(async (request) => {
  // Support loading .wasm files in Jest jsdom environment
  if (request.url.endsWith('.wasm')) {
    const filePath = fileURLToPath(request.url)
    const file = await readFile(filePath)
    return {
      status: 200,
      body: file,
    }
  } else {
    return {
      status: 404,
      body: 'Not Found',
    }
  }
})
