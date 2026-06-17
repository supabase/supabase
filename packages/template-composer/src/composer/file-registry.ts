import { extractConfig } from './extract-config'
import { EDGE_FUNCTION_PATH, extractEdgeFunction } from './extract-edge-function'
import { extractSql } from './extract-sql'
import { mergeSql } from './merge-sql'
import { mergeToml } from './merge-toml'
import type {
  MergeStrategy,
  MergeStrategyInput,
  MergeStrategyResult,
  ResourceCandidate,
  ResourceExtractor,
  ResourceExtractorInput,
} from './types'

/**
 * Declarative knowledge about a class of files the composer can handle.
 *
 * Handlers are matched in registry order: path matcher wins over extension
 * match, and the first matching handler is used. To support a new file kind,
 * add a single entry here instead of editing merge/extract/language switches.
 */
export interface FileTypeHandler {
  id: string
  extensions?: readonly string[]
  pathMatcher?: (path: string) => boolean
  language: string
  merge?: MergeStrategy
  extract?: ResourceExtractor
}

export const fileTypeRegistry: readonly FileTypeHandler[] = [
  {
    id: 'edge-function',
    pathMatcher: (path) => EDGE_FUNCTION_PATH.test(path),
    language: 'typescript',
    merge: edgeFunctionMerge,
    extract: extractEdgeFunction,
  },
  {
    id: 'toml',
    extensions: ['toml'],
    language: 'toml',
    merge: mergeToml,
    extract: extractConfig,
  },
  {
    id: 'sql',
    extensions: ['sql'],
    language: 'sql',
    merge: mergeSql,
    extract: extractSql,
  },
  {
    id: 'typescript',
    extensions: ['ts'],
    language: 'typescript',
  },
  {
    id: 'tsx',
    extensions: ['tsx'],
    language: 'tsx',
  },
  {
    id: 'javascript',
    extensions: ['js'],
    language: 'javascript',
  },
  {
    id: 'json',
    extensions: ['json'],
    language: 'json',
  },
]

export function resolveFileHandler(path: string): FileTypeHandler | undefined {
  for (const handler of fileTypeRegistry) {
    if (handler.pathMatcher?.(path)) return handler
  }

  const extension = path.split('.').pop()?.toLowerCase()
  if (!extension) return undefined

  return fileTypeRegistry.find((handler) => handler.extensions?.includes(extension))
}

export function inferLanguage(path: string): string {
  return resolveFileHandler(path)?.language ?? 'text'
}

export function mergeFileEntries(input: MergeStrategyInput): MergeStrategyResult {
  const handler = resolveFileHandler(input.path)

  if (handler?.merge) {
    return handler.merge(input)
  }

  // Fallback: last-wins with a warning. Deterministic and obvious.
  const winning = input.files[input.files.length - 1]
  return {
    content: winning.content,
    warnings: [`File ${input.path} exists in multiple templates - using ${winning.templateId}`],
  }
}

export function extractFromFile(input: ResourceExtractorInput): ResourceCandidate[] {
  const handler = resolveFileHandler(input.path)
  return handler?.extract?.(input) ?? []
}

/**
 * Edge functions can't be meaningfully merged: each function has its own entry
 * point. We pick deterministically (alphabetical by template id) and emit a
 * warning so the user can resolve the conflict instead of silently shipping
 * whichever template happened to load last.
 */
function edgeFunctionMerge({ path, files }: MergeStrategyInput): MergeStrategyResult {
  const sorted = [...files].sort((a, b) => a.templateId.localeCompare(b.templateId))
  const winner = sorted[0]
  const functionName = path.match(EDGE_FUNCTION_PATH)?.[1] ?? path

  return {
    content: winner.content,
    warnings: [
      `Duplicate edge function "${functionName}" from ${sorted
        .map((file) => file.templateId)
        .join(', ')} - using ${winner.templateId}`,
    ],
  }
}
