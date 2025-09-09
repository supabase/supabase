import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import ReactFlow, { Background, BackgroundVariant, MiniMap, type Node, type Edge } from 'reactflow'
import 'reactflow/dist/style.css'

import { copyToClipboard } from 'ui'
import { Checkbox } from '@ui/components/shadcn/ui/checkbox'
import { Label } from '@ui/components/shadcn/ui/label'
import { Button } from '@ui/components/shadcn/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import type { PlanMeta, PlanNodeData } from './types'
import { NODE_TYPE } from './constants'
import { buildGraphFromPlan } from './graph/build-graph-from-plan'
import {
  MetricsVisibilityContext,
  HeatmapContext,
  type MetricsVisibility,
  type HeatmapMode,
} from './contexts'
import { PlanNode } from './plan-node'

type ExplainPlanFlowProps = {
  json: string
}

export const ExplainPlanFlow = ({ json }: ExplainPlanFlowProps) => {
  const { nodes, edges, meta } = useMemo((): { nodes: Node[]; edges: Edge[]; meta?: PlanMeta } => {
    try {
      const parsed = JSON.parse(json) as any
      const root = Array.isArray(parsed) ? parsed[0] : parsed
      const meta: PlanMeta = {
        planningTime:
          typeof root?.['Planning Time'] === 'number' ? root['Planning Time'] : undefined,
        executionTime:
          typeof root?.['Execution Time'] === 'number' ? root['Execution Time'] : undefined,
        jitTotalTime:
          typeof root?.JIT?.Timing?.Total === 'number'
            ? root.JIT.Timing.Total
            : typeof root?.JIT?.['Total Time'] === 'number'
              ? root.JIT['Total Time']
              : undefined,
      }
      const planPart = root?.Plan ? [root] : parsed
      const graph = buildGraphFromPlan(planPart)
      if (!graph.nodes.length) {
        return {
          nodes: [],
          edges: [],
          meta: {
            ...meta,
            errorMessage: 'Invalid EXPLAIN JSON: Plan node not found.',
            errorDetail:
              'Provide output from EXPLAIN (FORMAT JSON) or EXPLAIN (ANALYZE, FORMAT JSON). The root should be an array and its first element must contain a "Plan" object.',
          },
        }
      }
      return {
        nodes: graph.nodes,
        edges: graph.edges,
        meta: { ...meta, subplanRoots: graph.subplanRoots },
      }
    } catch (e: any) {
      return {
        nodes: [],
        edges: [],
        meta: {
          errorMessage: 'Failed to parse JSON',
          errorDetail:
            (e?.message ? e.message : '') + '\nPaste valid JSON from EXPLAIN (FORMAT JSON).',
        },
      }
    }
  }, [json])

  const [metricsVisibility, setMetricsVisibility] = useState<MetricsVisibility>({
    time: true,
    rows: true,
    cost: true,
    buffers: true,
    output: true,
  })

  // Heatmap mode and maxima across nodes
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none')
  const heatMax = useMemo(() => {
    let maxTime = 0
    let maxRows = 0
    let maxCost = 0
    nodes.forEach((n) => {
      const d = n.data as PlanNodeData
      const t = (d.exclusiveTimeMs ?? 0) || (d.actualTotalTime ?? 0) * (d.actualLoops ?? 1)
      if (t > maxTime) maxTime = t
      const rowsMetric = (d.actualRows ?? 0) * (d.actualLoops ?? 1) || d.planRows || 0
      if (rowsMetric > maxRows) maxRows = rowsMetric
      const c = d.exclusiveCost ?? 0
      if (c > maxCost) maxCost = c
    })
    return { maxTime: maxTime || 1, maxRows: maxRows || 1, maxCost: maxCost || 1 }
  }, [nodes])

  const [selectedNode, setSelectedNode] = useState<PlanNodeData | null>(null)
  const [copiedConditions, setCopiedConditions] = useState(false)
  const [copiedOutputCols, setCopiedOutputCols] = useState(false)
  const [copiedRawJson, setCopiedRawJson] = useState(false)

  const { resolvedTheme } = useTheme()
  const miniMapMaskColor = resolvedTheme?.includes('dark')
    ? 'rgb(17, 19, 24, .8)'
    : 'rgb(237, 237, 237, .8)'

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  return (
    <div className="w-full h-full border border-green-500 relative">
      {meta?.errorMessage && (
        <div className="absolute inset-0 z-20 flex items-start justify-center mt-10 pointer-events-none">
          <div className="pointer-events-auto border border-red-500/70 bg-foreground-muted/20 backdrop-blur-sm rounded px-3 py-2 max-w-[720px] text-[11px]">
            <div className="font-semibold text-red-600">{meta.errorMessage}</div>
            {meta.errorDetail && (
              <div className="mt-1 whitespace-pre-wrap text-foreground-lighter">
                {meta.errorDetail}
              </div>
            )}
          </div>
        </div>
      )}
      {meta &&
        (meta.planningTime !== undefined ||
          meta.executionTime !== undefined ||
          meta.jitTotalTime !== undefined) && (
          <div className="absolute z-10 top-2 left-2 text-[10px] px-2 py-1 rounded bg-foreground-muted/20 backdrop-blur-sm border">
            <div className="flex gap-3">
              {meta.planningTime !== undefined && <span>planning: {meta.planningTime} ms</span>}
              {meta.executionTime !== undefined && <span>exec: {meta.executionTime} ms</span>}
              {meta.jitTotalTime !== undefined && <span>jit: {meta.jitTotalTime} ms</span>}
            </div>
          </div>
        )}
      {/* Subplan roots overlay panel */}
      {meta?.subplanRoots?.length && (
        <div className="absolute z-10 top-14 left-2 text-[10px] px-2 py-1 rounded bg-foreground-muted/20 backdrop-blur-sm border">
          <div>
            <span className="font-bold">Subplans:</span>{' '}
            {meta.subplanRoots.map((sp, i) => (
              <span key={sp.id}>
                {sp.name}
                {i < (meta.subplanRoots?.length ?? 0) - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="absolute z-10 top-2 right-2 text-[10px] p-2 rounded bg-foreground-muted/20 backdrop-blur-sm border">
        <div className="flex flex-wrap gap-2 items-center">
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.time}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, time: Boolean(checked) }))
              }
            />
            <span>time</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.rows}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, rows: Boolean(checked) }))
              }
            />
            <span>rows</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.cost}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, cost: Boolean(checked) }))
              }
            />
            <span>cost</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.buffers}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, buffers: Boolean(checked) }))
              }
            />
            <span>buffers</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.output}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, output: Boolean(checked) }))
              }
            />
            <span>output</span>
          </Label>
          <div className="h-[14px] w-px bg-border mx-1" />
          <div className="flex items-center gap-x-1">
            <span>Heatmap:</span>
            <Select value={heatmapMode} onValueChange={(v) => setHeatmapMode(v as HeatmapMode)}>
              <SelectTrigger size="tiny" className="w-20">
                <SelectValue placeholder="none" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="time">time</SelectItem>
                <SelectItem value="rows">rows</SelectItem>
                <SelectItem value="cost">cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {selectedNode && (
        <div className="absolute z-20 top-16 right-2 w-[380px] max-h-[75%] overflow-x-hidden overflow-y-auto rounded border bg-background shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-xs font-semibold truncate" title={selectedNode.label}>
              Details: {selectedNode.label}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2 py-1"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(75vh-48px)] text-[11px]">
            {/* Context line */}
            {(selectedNode.relationName || selectedNode.alias) && (
              <div className="text-foreground-lighter">
                {selectedNode.relationName ?? ''}
                {selectedNode.alias ? ` as ${selectedNode.alias}` : ''}
              </div>
            )}

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">Conditions</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0.5 text-[11px]"
                    onClick={() => {
                      const parts = [
                        selectedNode.hashCond && `Hash Cond: ${selectedNode.hashCond}`,
                        selectedNode.mergeCond && `Merge Cond: ${selectedNode.mergeCond}`,
                        selectedNode.joinFilter && `Join Filter: ${selectedNode.joinFilter}`,
                        selectedNode.indexCond && `Index Cond: ${selectedNode.indexCond}`,
                        selectedNode.recheckCond && `Recheck Cond: ${selectedNode.recheckCond}`,
                        selectedNode.filter && `Filter: ${selectedNode.filter}`,
                      ].filter(Boolean)
                      copyToClipboard(parts.join('\n'), () => {
                        setCopiedConditions(true)
                        setTimeout(() => setCopiedConditions(false), 1200)
                      })
                    }}
                  >
                    {copiedConditions ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                </div>
              </div>
              <ul className="space-y-1">
                {selectedNode.hashCond && (
                  <li>
                    <span className="text-foreground-lighter">Hash Cond:</span>{' '}
                    {selectedNode.hashCond}
                  </li>
                )}
                {selectedNode.mergeCond && (
                  <li>
                    <span className="text-foreground-lighter">Merge Cond:</span>{' '}
                    {selectedNode.mergeCond}
                  </li>
                )}
                {selectedNode.joinFilter && (
                  <li>
                    <span className="text-foreground-lighter">Join Filter:</span>{' '}
                    {selectedNode.joinFilter}
                  </li>
                )}
                {selectedNode.indexCond && (
                  <li>
                    <span className="text-foreground-lighter">Index Cond:</span>{' '}
                    {selectedNode.indexCond}
                  </li>
                )}
                {selectedNode.recheckCond && (
                  <li>
                    <span className="text-foreground-lighter">Recheck Cond:</span>{' '}
                    {selectedNode.recheckCond}
                  </li>
                )}
                {selectedNode.filter && (
                  <li>
                    <span className="text-foreground-lighter">Filter:</span> {selectedNode.filter}
                  </li>
                )}
                {!(
                  selectedNode.hashCond ||
                  selectedNode.mergeCond ||
                  selectedNode.joinFilter ||
                  selectedNode.indexCond ||
                  selectedNode.recheckCond ||
                  selectedNode.filter
                ) && <li className="text-foreground-lighter">(none)</li>}
              </ul>
            </div>

            {/* Output columns */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">Output Columns</div>
                {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0.5 text-[11px]"
                    onClick={() =>
                      copyToClipboard(selectedNode.outputCols!.join(', '), () => {
                        setCopiedOutputCols(true)
                        setTimeout(() => setCopiedOutputCols(false), 1200)
                      })
                    }
                  >
                    {copiedOutputCols ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                )}
              </div>
              {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 ? (
                <div className="p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
                  {selectedNode.outputCols.join(', ')}
                </div>
              ) : (
                <div className="text-foreground-lighter">(none)</div>
              )}
            </div>

            {/* Raw JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">Raw JSON</div>
                {selectedNode.raw && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0.5 text-[11px]"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(selectedNode.raw, null, 2), () => {
                        setCopiedRawJson(true)
                        setTimeout(() => setCopiedRawJson(false), 1200)
                      })
                    }
                  >
                    {copiedRawJson ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                )}
              </div>
              {selectedNode.raw ? (
                <pre className="p-2 border rounded bg-surface-100 overflow-auto max-h-[240px] text-[10px]">
                  {JSON.stringify(selectedNode.raw, null, 2)}
                </pre>
              ) : (
                <div className="text-foreground-lighter">(no data)</div>
              )}
            </div>
          </div>
        </div>
      )}
      <MetricsVisibilityContext.Provider value={metricsVisibility}>
        <HeatmapContext.Provider
          value={{
            mode: heatmapMode,
            maxTime: heatMax.maxTime,
            maxRows: heatMax.maxRows,
            maxCost: heatMax.maxCost,
          }}
        >
          <ReactFlow
            defaultNodes={[]}
            defaultEdges={[]}
            nodesConnectable={false}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              deletable: false,
              style: {
                stroke: 'hsl(var(--border-stronger))',
                strokeWidth: 1,
              },
            }}
            fitView
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            minZoom={0.8}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
            onInit={(instance) => {
              if (nodes.length > 0) {
                setTimeout(() => instance.fitView({}))
              }
            }}
            onNodeClick={(e, node) => setSelectedNode(node.data as PlanNodeData)}
            onPaneClick={() => setSelectedNode(null)}
          >
            <Background
              gap={16}
              className="[&>*]:stroke-foreground-muted opacity-[25%]"
              variant={BackgroundVariant.Dots}
              color={'inherit'}
            />
            <MiniMap
              pannable
              zoomable
              nodeColor="#111318"
              maskColor={miniMapMaskColor}
              className="border rounded-md shadow-sm"
            />
          </ReactFlow>
        </HeatmapContext.Provider>
      </MetricsVisibilityContext.Provider>
    </div>
  )
}
