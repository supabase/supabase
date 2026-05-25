import type { DependencyResolution, MergeResult } from './composer'
import { extractComposerResources } from './resources'
import type { Template } from './templates'

export type ComposerGraphNodeKind = 'template' | 'resource' | 'warning'
export type ComposerGraphEdgeKind = 'dependency' | 'output' | 'warning'

export interface ComposerGraphNode {
  id: string
  kind: ComposerGraphNodeKind
  label: string
  meta?: Record<string, string | number | boolean>
}

export interface ComposerGraphEdge {
  id: string
  source: string
  target: string
  kind: ComposerGraphEdgeKind
  label?: string
}

export interface ComposerGraph {
  nodes: ComposerGraphNode[]
  edges: ComposerGraphEdge[]
}

export function buildComposerGraph({
  templates,
  selectedIds,
  resolution,
  mergeResult,
}: {
  templates: Template[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  mergeResult: MergeResult | null
}): ComposerGraph {
  const nodes: ComposerGraphNode[] = []
  const edges: ComposerGraphEdge[] = []
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
    for (const resource of extractComposerResources({
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
