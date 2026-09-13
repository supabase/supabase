import { OpenAPIDefinition } from '../types'
import {
  findPrimaryKeys,
  propAccess,
  sanitizeIdentifier,
  toCamelCase,
  toPascalCase,
  toSingular,
} from '../utils'

// Generate list component content
export function generateListContent(tableName: string, definition: OpenAPIDefinition): string {
  const safeTableId = sanitizeIdentifier(tableName)
  const pascalName = toPascalCase(safeTableId)
  const singularName = toSingular(safeTableId)
  const singularPascal = toPascalCase(singularName)
  const camelName = toCamelCase(safeTableId)
  const collectionName = `${camelName}Collection`
  const listComponentName = `${pascalName}List`
  const sheetComponentName = `${singularPascal}Sheet`
  const properties = definition.properties || {}
  const primaryKeys = findPrimaryKeys(properties)
  const primaryKey = primaryKeys[0] || 'id'

  // Get display fields (non-system fields, first 2 for display)
  const editableFields = Object.entries(properties).filter(([name]) => {
    const isSystemField =
      name === primaryKey || name === 'created_at' || name === 'updated_at' || name.endsWith('_at')
    return !isSystemField
  })
  const displayField = editableFields[0]?.[0] || primaryKey
  const secondaryField = editableFields[1]?.[0]

  // Get all fields for select
  const allFieldNames = Object.keys(properties)
  const selectFields = allFieldNames
    .map((name) => `          ${JSON.stringify(name)}: ${propAccess('item', name)},`)
    .join('\n')

  // Determine if we have created_at for display
  const hasCreatedAt = properties['created_at'] !== undefined

  // Pre-compute safe property access expressions for the template
  const displayAccess = propAccess('item', displayField)
  const primaryKeyAccess = propAccess('item', primaryKey)

  // Generate secondary info display
  let secondaryInfo = ''
  if (secondaryField) {
    const secondaryAccess = propAccess('item', secondaryField)
    secondaryInfo = `
                    {${secondaryAccess} && (
                      <span className="truncate">{${secondaryAccess}}</span>
                    )}
                    ${hasCreatedAt ? `<span>•</span>` : ''}`
  }

  return `'use client'

import { useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { Pencil, Plus, Trash2, FileText } from 'lucide-react'

import { ${collectionName} } from '@/lib/db'
import { ${pascalName} } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ${sheetComponentName} } from './${singularName}-sheet'

export function ${listComponentName}() {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<${pascalName} | null>(null)

  const { data: items = [] } = useLiveQuery(
    (q) =>
      q
        .from({ item: ${collectionName} })
        .orderBy(({ item }) => ${displayAccess}, 'asc')
        .select(({ item }) => ({
${selectFields}
        })),
    []
  )

  const handleDelete = (itemId: string) => {
    ${collectionName}.delete([itemId])
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border/50 border-b bg-linear-to-r from-primary/5 to-transparent p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight">${pascalName}</h1>
              <p className="text-muted-foreground text-sm">
                {items.length} ${singularName.replace(/_/g, ' ')}{items.length !== 1 ? 's' : ''} in database
              </p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            Add ${singularPascal}
          </Button>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length > 0 ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg p-4',
                  'border border-border/50 bg-card shadow-xs',
                  'transition-all duration-150 hover:shadow-md hover:border-border'
                )}
                key={${primaryKeyAccess}}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-chart-1/20 to-chart-2/20 shrink-0">
                    <FileText className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {${displayAccess} || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-3 text-muted-foreground text-xs">${secondaryInfo}${
                      hasCreatedAt
                        ? `
                      <span>
                        Created {new Date(item.created_at).toLocaleDateString()}
                      </span>`
                        : `
                      <span className="font-mono truncate max-w-[120px]" title={${primaryKeyAccess}}>
                        {${primaryKeyAccess}.slice(0, 8)}...
                      </span>`
                    }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => setEditingItem(item)}
                    size="sm"
                    variant="ghost"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(${primaryKeyAccess})}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg">
            <FileText className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No ${tableName.replace(/_/g, ' ')} yet</p>
            <p className="text-sm mb-4">Create your first ${singularName.replace(/_/g, ' ')} to get started</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsCreateSheetOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add ${singularPascal}
            </Button>
          </div>
        )}
      </div>

      {/* Create Sheet */}
      <${sheetComponentName}
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        mode="create"
      />

      {/* Edit Sheet */}
      <${sheetComponentName}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        mode="edit"
        item={editingItem}
      />
    </div>
  )
}
`
}
