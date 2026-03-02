import { Search, Download, X, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button, Badge } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import SchemaSelector from 'components/ui/SchemaSelector'
import type { DependencyGraphNodeType } from 'data/dependency-graph/dependency-graph-query'
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from './types'

interface SchemaGraphControlsProps {
  selectedSchema: string
  onSchemaChange: (schema: string) => void
  search: string
  onSearchChange: (search: string) => void
  selectedTypes: DependencyGraphNodeType[]
  onTypesChange: (types: DependencyGraphNodeType[]) => void
  onExportPNG: () => void
  onExportSVG: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  nodeCount: number
  edgeCount: number
}

const ALL_TYPES: DependencyGraphNodeType[] = [
  'table',
  'view',
  'materialized_view',
  'function',
  'trigger',
  'policy',
  'index',
  'sequence',
  'type',
]

export function SchemaGraphControls({
  selectedSchema,
  onSchemaChange,
  search,
  onSearchChange,
  selectedTypes,
  onTypesChange,
  onExportPNG,
  onExportSVG,
  onZoomIn,
  onZoomOut,
  onFitView,
  nodeCount,
  edgeCount,
}: SchemaGraphControlsProps) {
  const toggleType = (type: DependencyGraphNodeType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  const selectAllTypes = () => onTypesChange([...ALL_TYPES])
  const clearTypes = () => onTypesChange([])

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
      {/* Main controls card */}
      <div className="bg-surface-100 border rounded-lg p-3 shadow-lg max-w-[320px]">
        <div className="flex flex-col gap-3">
          {/* Schema selector */}
          <div>
            <label className="text-xs text-foreground-light mb-1 block">Schema</label>
            <SchemaSelector
              selectedSchemaName={selectedSchema}
              onSelectSchema={onSchemaChange}
              size="tiny"
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-xs text-foreground-light mb-1 block">Search</label>
            <Input
              size="tiny"
              placeholder="Search objects..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<Search size={14} />}
              actions={
                search && (
                  <Button
                    type="text"
                    size="tiny"
                    icon={<X size={12} />}
                    onClick={() => onSearchChange('')}
                    className="px-1"
                  />
                )
              }
            />
          </div>

          {/* Type filters */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-foreground-light">Object Types</label>
              <div className="flex gap-1">
                <Button type="text" size="tiny" onClick={selectAllTypes}>
                  All
                </Button>
                <Button type="text" size="tiny" onClick={clearTypes}>
                  None
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {ALL_TYPES.map((type) => (
                <Badge
                  key={type}
                  variant={selectedTypes.includes(type) ? 'brand' : 'default'}
                  className="cursor-pointer text-xs"
                  style={{
                    backgroundColor: selectedTypes.includes(type)
                      ? NODE_TYPE_COLORS[type]
                      : undefined,
                    borderColor: NODE_TYPE_COLORS[type],
                  }}
                  onClick={() => toggleType(type)}
                >
                  {NODE_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-foreground-light border-t pt-2">
            <span>{nodeCount} nodes</span>
            <span>{edgeCount} edges</span>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="bg-surface-100 border rounded-lg shadow-lg flex">
        <Button
          type="text"
          size="tiny"
          icon={<ZoomIn size={14} />}
          onClick={onZoomIn}
          className="rounded-r-none"
        />
        <Button
          type="text"
          size="tiny"
          icon={<ZoomOut size={14} />}
          onClick={onZoomOut}
          className="rounded-none border-x"
        />
        <Button
          type="text"
          size="tiny"
          icon={<Maximize size={14} />}
          onClick={onFitView}
          className="rounded-l-none"
        />
      </div>

      {/* Export controls */}
      <div className="bg-surface-100 border rounded-lg shadow-lg flex">
        <Button
          type="text"
          size="tiny"
          icon={<Download size={14} />}
          onClick={onExportPNG}
          className="rounded-r-none"
        >
          PNG
        </Button>
        <Button
          type="text"
          size="tiny"
          icon={<Download size={14} />}
          onClick={onExportSVG}
          className="rounded-l-none border-l"
        >
          SVG
        </Button>
      </div>
    </div>
  )
}
