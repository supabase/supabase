import type { DependencyResolution, MergeResult } from './composition'
import { extractCompositionResources } from './resources'
import type { Template } from '../template-catalog'

export type CompositionGraphNodeKind = 'template' | 'resource' | 'warning'
export type CompositionGraphEdgeKind = 'dependency' | 'output' | 'warning'

export interface CompositionGraphNode {
  id: string
  kind: CompositionGraphNodeKind
  label: string
  meta?: Record<string, string | number | boolean>
}

export interface CompositionGraphEdge {
  id: string
  source: string
  target: string
  kind: CompositionGraphEdgeKind
  label?: string
}

export interface CompositionGraph {
  nodes: CompositionGraphNode[]
  edges: CompositionGraphEdge[]
}

export function buildCompositionGraph({
  templates,
  selectedIds,
  resolution,
  mergeResult,
}: {
  templates: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  mergeResult: MergeResult | null
}): CompositionGraph {
  const nodes: CompositionGraphNode[] = []
  const edges: CompositionGraphEdge[] = []
  const resolvedIds = new Set(resolution.resolved.map((template) => template.id))

  for (const template of resolution.resolved) {
    nodes.push({
      id: templateNodeId(template.id),
      kind: 'template',
      label: template.name,
      meta: {
        category: template.category,
        explicit: selectedIds.has(template.id),
        defaultEnabled: template.defaultEnabled ?? false,
      },
    })

    for (const dependencyId of template.dependencies?.required ?? []) {
      if (!resolvedIds.has(dependencyId)) continue

      edges.push({
        id: `dependency:${dependencyId}->${template.id}`,
        source: templateNodeId(dependencyId),
        target: templateNodeId(template.id),
        kind: 'dependency',
        label: 'requires',
      })
    }
  }

  for (const missingDependencyId of resolution.missingDeps) {
    nodes.push({
      id: warningNodeId(`missing:${missingDependencyId}`),
      kind: 'warning',
      label: `Missing dependency: ${missingDependencyId}`,
    })
  }

  if (mergeResult) {
    for (const resource of extractCompositionResources({
      templates: resolution.resolved,
      mergeResult,
    })) {
      nodes.push({
        id: resourceNodeId(resource.id),
        kind: 'resource',
        label: resource.label,
        meta: {
          resourceKind: resource.kind,
          sourceFilePath: resource.sourceFilePath,
          sources: resource.sourceTemplateIds.length,
          ...(resource.schema ? { schema: resource.schema } : {}),
        },
      })

      for (const sourceId of resource.sourceTemplateIds) {
        edges.push({
          id: `output:${sourceId}->${resource.id}`,
          source: templateNodeId(sourceId),
          target: resourceNodeId(resource.id),
          kind: 'output',
          label: 'writes',
        })
      }
    }

    for (const [index, warning] of mergeResult.warnings.entries()) {
      const warningId = warningNodeId(`merge:${index}`)
      nodes.push({
        id: warningId,
        kind: 'warning',
        label: warning,
      })

      for (const template of templates) {
        if (!warning.includes(template.id)) continue

        edges.push({
          id: `warning:${template.id}->${index}`,
          source: templateNodeId(template.id),
          target: warningId,
          kind: 'warning',
        })
      }
    }
  }

  return { nodes, edges }
}

function templateNodeId(id: string) {
  return `template:${id}`
}

function resourceNodeId(id: string) {
  return `resource:${id}`
}

function warningNodeId(id: string) {
  return `warning:${id}`
}
