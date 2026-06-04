import type { ResourceExtractor } from './types'

export const EDGE_FUNCTION_PATH = /(?:^|\/)functions\/([^/]+)\/index\.(?:ts|js)$/

export function getEdgeFunctionName(path: string): string | null {
  return path.match(EDGE_FUNCTION_PATH)?.[1] ?? null
}

export const extractEdgeFunction: ResourceExtractor = ({ path, templateId }) => {
  const name = getEdgeFunctionName(path)
  if (!name || name === '_shared') return []

  return [
    {
      id: `edge-function:${name}`,
      kind: 'edge-function',
      label: name,
      sourceFilePath: path,
      sourceTemplateId: templateId,
      iconKey: 'edge-function',
      parentResourceId: 'config:edge_runtime',
    },
  ]
}
