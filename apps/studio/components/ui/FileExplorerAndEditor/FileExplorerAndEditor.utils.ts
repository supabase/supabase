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
