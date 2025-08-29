import { Parser } from '@deno/eszip'
import path from 'path'

function url2path(url: string) {
  try {
    // Parse the URL
    return new URL(url).pathname
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

export async function parseEszip(bytes: Uint8Array) {
  try {
    const parser = await getParser()
    if (!parser) {
      throw new Error('Failed to initialize parser')
    }

    // Parse bytes in a try-catch block
    let specifiers: string[] = []
    try {
      specifiers = await parser.parseBytes(bytes)
    } catch (parseError) {
      console.error('Error parsing bytes:', parseError)
      // Reset parser on parse error
      parserPromise = null
      throw parseError
    }

    // Load in a separate try-catch
    try {
      await parser.load()
    } catch (loadError) {
      console.error('Error loading parser:', loadError)
      parserPromise = null
      throw loadError
    }

    // Extract version
    let version = parseInt(await parser.getModuleSource('---SUPABASE-ESZIP-VERSION-ESZIP---'))
    if (isNaN(version)) {
      version = 0
    }

    // Extract files from the eszip
    const files = await extractEszip(parser, specifiers, version >= 2)

    // Convert files to the expected format
    const responseFiles = await Promise.all(
      files.map(async (file) => {
        const content = await file.text()
        return {
          name: file.name,
          content: content,
        }
      })
    )

    return {
      version,
      files: responseFiles,
    }
  } catch (error) {
    console.error('Error in parseEszip:', error)
    throw error
  }
}

async function extractEszip(parser: any, specifiers: string[], isDeno2: boolean) {
  const files = []

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
      // Try to get the module source
      const moduleSource = await parser.getModuleSource(specifier)
      let qualifiedSpecifier = specifier

      // Get the file path
      if (isDeno2 && !specifier.startsWith('file://')) {
        qualifiedSpecifier = `file://${specifier}`
      }
      const filePath = url2path(qualifiedSpecifier)

      // Create a file object
      const file = new File([moduleSource], filePath)

      files.push(file)
    } catch (error) {
      console.error('Error processing specifier:', specifier, error)
    }
  }

  return files
}
