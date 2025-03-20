import { NextApiRequest, NextApiResponse } from 'next'
import { Parser } from '@deno/eszip'
import path from 'path'

// Configure API route to handle raw binary data
export const config = {
  api: {
    bodyParser: false,
  },
}

function url2path(url: string) {
  try {
    // Parse the URL
    const parsedUrl = new URL(url)
    // Get the pathname and split it
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean)

    // For user function paths like "user_fn_ukekbxwcwofeosgskskm_66727868-6415-49d7-b518-2a057c8377cb_1/data.json"
    // Just return the filename (data.json)
    if (pathParts.length > 0) {
      // Check if it's a user function path with UUID
      if (pathParts[0].startsWith('user_fn_')) {
        // Get just the filename (last part)
        return pathParts[pathParts.length - 1]
      }

      // If it starts with 'tmp/' or similar, remove that prefix
      if (pathParts[0] === 'tmp' || pathParts[0] === 'deno') {
        // Get just the filename (last part)
        return pathParts[pathParts.length - 1]
      }
    }

    // Otherwise, return the full path without leading/trailing slashes
    return pathParts.join('/')
  } catch (error) {
    // If URL parsing fails, fallback to extracting just the filename
    console.warn('Failed to parse URL:', url)
    try {
      // Try to extract just the filename part
      const parts = url.split('/').filter(Boolean)
      if (parts.length > 0) {
        return parts[parts.length - 1] // Return just the filename
      }
    } catch (e) {
      // Last resort: use the original path joining
      console.error('Failed to extract filename:', e)
    }
    return path.join(...new URL(url).pathname.split('/').filter(Boolean))
  }
}

// Helper to get raw body as ArrayBuffer
async function getRawBody(req: NextApiRequest): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []

    req.on('data', (chunk: Buffer) => {
      chunks.push(new Uint8Array(chunk))
    })

    req.on('end', () => {
      // Combine all chunks into a single ArrayBuffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      resolve(result.buffer)
    })

    req.on('error', reject)
  })
}

// Initialize parser outside of request handler
let parserPromise: Promise<any> | null = null

async function getParser() {
  if (!parserPromise) {
    parserPromise = Parser.createInstance().catch((err) => {
      console.error('Failed to create parser instance:', err)
      parserPromise = null
      throw err
    })
  }
  return parserPromise
}

async function loadEszip(bytes: Uint8Array) {
  console.log('Starting loadEszip with bytes length:', bytes.length)
  try {
    const parser = await getParser()
    if (!parser) {
      throw new Error('Failed to initialize parser')
    }

    console.log('Parser instance created successfully')

    // Parse bytes in a try-catch block
    let specifiers
    try {
      console.log('Parsing bytes...')
      specifiers = await parser.parseBytes(bytes)
      console.log('parseBytes completed successfully, specifiers:', specifiers)
    } catch (parseError) {
      console.error('Error parsing bytes:', parseError)
      // Reset parser on parse error
      parserPromise = null
      throw parseError
    }

    // Load in a separate try-catch
    try {
      console.log('Loading parser...')
      await parser.load()
      console.log('Parser loaded successfully')
    } catch (loadError) {
      console.error('Error loading parser:', loadError)
      parserPromise = null
      throw loadError
    }

    return { parser, specifiers }
  } catch (error) {
    console.error('Error in loadEszip:', error)
    throw error
  }
}

async function extractEszip(parser: any, specifiers: string[]) {
  console.log('extractEszip called with specifiers:', JSON.stringify(specifiers))
  const files = []

  console.log('Total specifiers found:', specifiers.length)

  // First, filter out the specifiers we want to keep
  const filteredSpecifiers = specifiers.filter((specifier) => {
    const shouldSkip =
      specifier.startsWith('---') ||
      specifier.startsWith('npm:') ||
      specifier.startsWith('static:') ||
      specifier.startsWith('vfs:') ||
      specifier.startsWith('https:') ||
      specifier.startsWith('jsr:')

    if (shouldSkip) {
      console.log('Skipping specifier:', specifier)
    } else {
      console.log('Keeping specifier:', specifier)
    }

    return !shouldSkip
  })

  console.log('Filtered specifiers count:', filteredSpecifiers.length)
  console.log('Filtered specifiers:', JSON.stringify(filteredSpecifiers))

  // Then process each one
  for (const specifier of filteredSpecifiers) {
    try {
      console.log('Processing specifier:', specifier)

      // Try to get the module source
      console.log('Calling getModuleSource for:', specifier)
      const module = await parser.getModuleSource(specifier)
      console.log('Module source obtained, size:', module.length)

      // Get the file path
      const filePath = url2path(specifier)
      console.log('Mapped file path:', filePath)

      // Create a file object
      const file = new File([module], filePath, {
        type: 'text/typescript',
      })
      console.log('File created:', file.name, 'size:', file.size)

      files.push(file)
      console.log('File added to list, current count:', files.length)
    } catch (error) {
      console.error('Error processing specifier:', specifier, error)
    }
  }

  console.log('Total files extracted:', files.length)
  console.log(
    'Files list:',
    files.map((f) => ({ name: f.name, size: f.size }))
  )

  return files
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== PARSE BODY API REQUEST RECEIVED ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', JSON.stringify(req.headers))

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the raw body as ArrayBuffer
    console.log('Getting raw body...')
    const arrayBuffer = await getRawBody(req)
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return res.status(400).json({ error: 'Request body is required' })
    }

    // Debug logging
    console.log('ArrayBuffer byteLength:', arrayBuffer.byteLength)

    // Convert ArrayBuffer directly to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer)
    console.log('Uint8Array length:', uint8Array.length)

    console.log('Calling loadEszip...')
    const { parser, specifiers } = await loadEszip(uint8Array)
    console.log('loadEszip returned. Specifiers count:', specifiers.length)

    console.log('Calling extractEszip...')
    const files = await extractEszip(parser, specifiers)
    console.log('extractEszip returned files count:', files.length)

    // Prepare response
    const responseFiles = await Promise.all(
      files.map(async (file) => {
        const content = await file.text()
        return {
          name: file.name,
          content: content,
        }
      })
    )

    console.log('Final response files count:', responseFiles.length)
    console.log(
      'Response file names:',
      responseFiles.map((f) => f.name)
    )

    return res.status(200).json({
      files: responseFiles,
    })
  } catch (error) {
    console.error('Error processing edge function body:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
