import type { EdgeFunctionDeployment } from './types'
import type { CodeBlockLang } from 'ui'

// Ensure newest first: sort by version desc, then created_at desc
export const sortDeployments = (items: EdgeFunctionDeployment[]) =>
  items
    .slice()
    .sort((a, b) => (b.version !== a.version ? b.version - a.version : b.created_at - a.created_at))

export const inferLanguageFromPath = (path: string): CodeBlockLang => {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'ts'
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'js'
    case 'json':
      return 'json'
    default:
      return 'ts'
  }
}

export const formatDateTime = (input: string | number | Date) => {
  const date = new Date(input)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
