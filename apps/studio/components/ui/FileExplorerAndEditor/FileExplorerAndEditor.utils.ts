import { BlobReader, BlobWriter, Entry, TextWriter, ZipReader } from '@zip.js/zip.js'

// Configuration for zip file extraction
export const ZIP_EXTRACTION_CONFIG = {
  // Maximum total extracted size: 50MB (reasonable for edge functions)
  MAX_TOTAL_EXTRACTED_SIZE: 50 * 1024 * 1024, // 50MB

  // Maximum individual file size: 10MB
  MAX_INDIVIDUAL_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // Allowed file extensions for extraction (edge function context)
  ALLOWED_EXTENSIONS: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'mjs',
    'cjs',
    'json',
    'jsonc',
    'md',
    'txt',
    'css',
    'scss',
    'sass',
    'less',
    'html',
    'htm',
    'yaml',
    'yml',
    'toml',
    'sh',
    'env',
    'gitignore',
    'graphql',
    'gql',
    'wasm', // Binary but needed for edge functions
  ],

  // Binary extensions that should be preserved (not skipped)
  ALLOWED_BINARY_EXTENSIONS: ['wasm'],
} as const

export const isBinaryFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const binaryExtensions = [
    'wasm',
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'ico',
    'svg',
    'mp3',
    'mp4',
    'avi',
    'mov',
    'zip',
    'rar',
    '7z',
    'tar',
    'gz',
    'bz2',
    'pdf',
  ]
  return binaryExtensions.includes(extension || '')
}

export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'md':
      return 'markdown'
    case 'csv':
      return 'csv'
    default:
      return 'plaintext' // Default to plaintext
  }
}

/**
 * Check if a file is a zip archive based on file extension
 */
export const isZipFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension === 'zip'
}

/**
 * Get file extension from a filename
 */
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

/**
 * Check if a file extension is allowed for extraction
 */
export const isAllowedExtension = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return (ZIP_EXTRACTION_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

/**
 * Check if a file is binary but allowed (like .wasm)
 */
export const isAllowedBinaryFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return (ZIP_EXTRACTION_CONFIG.ALLOWED_BINARY_EXTENSIONS as readonly string[]).includes(extension)
}

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Extract files from a zip archive
 * Returns an array of extracted files with their full paths as names (flat structure)
 */
export const extractZipFile = async (
  zipFile: File,
  onProgress?: (current: number, total: number) => void
): Promise<{ name: string; content: string; size: number }[]> => {
  const zipReader = new ZipReader(new BlobReader(zipFile))
  const entries = await zipReader.getEntries()

  const extractedFiles: { name: string; content: string; size: number }[] = []
  const skippedFiles: string[] = []
  const oversizedFiles: string[] = []
  const rejectedExtensions: string[] = []

  let totalExtractedSize = 0

  // Filter out directories and process files
  const fileEntries = entries.filter((entry) => !entry.directory)

  for (let i = 0; i < fileEntries.length; i++) {
    const entry = fileEntries[i]
    const fileName = entry.filename

    // Report progress
    if (onProgress) {
      onProgress(i + 1, fileEntries.length)
    }

    // Skip hidden files and system files
    const pathParts = fileName.split('/')
    const hasHiddenFolder = pathParts.some((part) => part.startsWith('.') || part === '__MACOSX')
    if (hasHiddenFolder || fileName === '.DS_Store') {
      skippedFiles.push(fileName)
      continue
    }

    // Check file extension
    if (!isAllowedExtension(fileName) && !isAllowedBinaryFile(fileName)) {
      rejectedExtensions.push(fileName)
      continue
    }

    // Check individual file size
    const uncompressedSize = entry.uncompressedSize
    if (uncompressedSize > ZIP_EXTRACTION_CONFIG.MAX_INDIVIDUAL_FILE_SIZE) {
      oversizedFiles.push(`${fileName} (${formatBytes(uncompressedSize)})`)
      continue
    }

    // Check total extracted size
    if (totalExtractedSize + uncompressedSize > ZIP_EXTRACTION_CONFIG.MAX_TOTAL_EXTRACTED_SIZE) {
      throw new Error(
        `Total extracted size would exceed ${formatBytes(ZIP_EXTRACTION_CONFIG.MAX_TOTAL_EXTRACTED_SIZE)}. ` +
          `Current: ${formatBytes(totalExtractedSize)}, ` +
          `Attempted to add: ${formatBytes(uncompressedSize)}`
      )
    }

    // Extract file content
    let content: string
    if (isBinaryFile(fileName) && isAllowedBinaryFile(fileName)) {
      // For allowed binary files (like .wasm), read as blob and convert to binary string
      const blob = await entry.getData!(new BlobWriter())
      const arrayBuffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      content = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    } else {
      // For text files, read as text
      content = await entry.getData!(new TextWriter())
    }

    extractedFiles.push({
      name: fileName, // Keep full path as file name (flat structure)
      content,
      size: uncompressedSize,
    })

    totalExtractedSize += uncompressedSize
  }

  await zipReader.close()

  // Throw error if no valid files found
  if (extractedFiles.length === 0) {
    const reasons: string[] = []
    if (skippedFiles.length > 0) {
      reasons.push(`${skippedFiles.length} hidden/system files`)
    }
    if (rejectedExtensions.length > 0) {
      reasons.push(`${rejectedExtensions.length} unsupported file types`)
    }
    if (oversizedFiles.length > 0) {
      reasons.push(`${oversizedFiles.length} oversized files`)
    }
    throw new Error(
      `No valid files found in zip archive. ${reasons.length > 0 ? 'Skipped: ' + reasons.join(', ') : ''}`
    )
  }

  return extractedFiles
}
