import { OpenAPIDefinition } from '../types'
import { findPrimaryKeys, toCamelCase, toLabel, toPascalCase, toSingular } from '../utils'

// Generate sheet component content
export function generateSheetContent(tableName: string, definition: OpenAPIDefinition): string {
  const pascalName = toPascalCase(tableName)
  const singularName = toSingular(tableName)
  const singularPascal = toPascalCase(singularName)
  const camelName = toCamelCase(tableName)
  const collectionName = `${camelName}Collection`
  const sheetComponentName = `${singularPascal}Sheet`
  const properties = definition.properties || {}
  const required = definition.required || []
  const primaryKeys = findPrimaryKeys(properties)
  const primaryKey = primaryKeys[0] || 'id'

  // Separate fields into editable and read-only
  const allFields = Object.entries(properties)
  const editableFields = allFields.filter(([name]) => {
    const isSystemField =
      name === primaryKey || name === 'created_at' || name === 'updated_at' || name.endsWith('_at')
    return !isSystemField
  })
  const readOnlyFields = allFields.filter(([name]) => {
    return (
      name === primaryKey || name === 'created_at' || name === 'updated_at' || name.endsWith('_at')
    )
  })

  // Generate state declarations
  const stateDeclarations = editableFields
    .map(([name, prop]) => {
      const stateName = toCamelCase(name)
      if (prop.type === 'boolean') {
        return `  const [${stateName}, set${toPascalCase(name)}] = useState(false)`
      }
      if (prop.type === 'integer' || prop.type === 'number') {
        return `  const [${stateName}, set${toPascalCase(name)}] = useState<number | ''>(0)`
      }
      return `  const [${stateName}, set${toPascalCase(name)}] = useState('')`
    })
    .join('\n')

  // Generate useEffect reset
  const useEffectReset = editableFields
    .map(([name, prop]) => {
      const stateName = toCamelCase(name)
      const setterName = `set${toPascalCase(name)}`
      if (prop.type === 'boolean') {
        return `      ${setterName}(item?.${name} ?? false)`
      }
      if (prop.type === 'integer' || prop.type === 'number') {
        return `      ${setterName}(item?.${name} ?? 0)`
      }
      return `      ${setterName}(item?.${name} ?? '')`
    })
    .join('\n')

  // Generate form fields for editable fields
  const editableFormFields = editableFields
    .map(([name, prop]) => {
      const stateName = toCamelCase(name)
      const setterName = `set${toPascalCase(name)}`
      const label = toLabel(name)
      const isRequired = required.includes(name)

      if (prop.type === 'boolean') {
        return `          {/* ${label} Field */}
          <div className="flex items-center gap-3">
            <input
              id="${singularName}-${name}"
              type="checkbox"
              checked={${stateName}}
              onChange={(e) => ${setterName}(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <Label htmlFor="${singularName}-${name}">${label}</Label>
          </div>`
      }

      if (prop.type === 'integer' || prop.type === 'number') {
        return `          {/* ${label} Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="${singularName}-${name}">
              ${label}${isRequired ? ' <span className="text-destructive">*</span>' : ''}
            </Label>
            <Input
              id="${singularName}-${name}"
              type="number"
              value={${stateName}}
              onChange={(e) => ${setterName}(e.target.value ? Number(e.target.value) : '')}
              placeholder="Enter ${label.toLowerCase()}"
            />
          </div>`
      }

      if (prop.enum && prop.enum.length > 0) {
        const options = prop.enum
          .map((e) => `              <option value="${e}">${toLabel(e)}</option>`)
          .join('\n')
        return `          {/* ${label} Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="${singularName}-${name}">
              ${label}${isRequired ? ' <span className="text-destructive">*</span>' : ''}
            </Label>
            <select
              id="${singularName}-${name}"
              value={${stateName}}
              onChange={(e) => ${setterName}(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select ${label.toLowerCase()}</option>
${options}
            </select>
          </div>`
      }

      return `          {/* ${label} Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="${singularName}-${name}">
              ${label}${isRequired ? ' <span className="text-destructive">*</span>' : ''}
            </Label>
            <Input
              id="${singularName}-${name}"
              value={${stateName}}
              onChange={(e) => ${setterName}(e.target.value)}
              placeholder="Enter ${label.toLowerCase()}"
            />
          </div>`
    })
    .join('\n\n')

  // Generate read-only fields for edit mode
  const readOnlyFormFields = readOnlyFields
    .map(([name]) => {
      const label = toLabel(name)
      const isTimestamp = name.endsWith('_at')
      const displayValue = isTimestamp ? `new Date(item.${name}).toLocaleString()` : `item.${name}`

      return `            {/* ${label} - Read Only */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="${singularName}-${name}" className="text-muted-foreground">
                ${label}
              </Label>
              <Input
                id="${singularName}-${name}"
                value={${displayValue}}
                disabled
                className="${name === primaryKey ? 'font-mono text-sm ' : ''}bg-muted"
              />
            </div>`
    })
    .join('\n\n')

  // Generate insert data
  const insertData = [
    `        ${primaryKey}: crypto.randomUUID(),`,
    ...editableFields.map(([name, prop]) => {
      const stateName = toCamelCase(name)
      if (prop.type === 'boolean') {
        return `        ${name}: ${stateName},`
      }
      if (prop.type === 'integer' || prop.type === 'number') {
        return `        ${name}: ${stateName} || 0,`
      }
      return `        ${name}: ${stateName},`
    }),
    // Add timestamps if they exist
    ...readOnlyFields
      .filter(([name]) => name === 'created_at')
      .map(() => `        created_at: new Date().toISOString(),`),
  ].join('\n')

  // Generate update data (direct mutations on draft)
  const updateData = editableFields
    .map(([name, prop]) => {
      const stateName = toCamelCase(name)
      if (prop.type === 'boolean') {
        return `        draft.${name} = ${stateName}`
      }
      if (prop.type === 'integer' || prop.type === 'number') {
        return `        draft.${name} = ${stateName} || 0`
      }
      return `        draft.${name} = ${stateName}`
    })
    .join('\n')

  // Generate reset states
  const resetStates = editableFields
    .map(([name, prop]) => {
      const setterName = `set${toPascalCase(name)}`
      if (prop.type === 'boolean') {
        return `    ${setterName}(false)`
      }
      if (prop.type === 'integer' || prop.type === 'number') {
        return `    ${setterName}(0)`
      }
      return `    ${setterName}('')`
    })
    .join('\n')

  // Generate validation (check required fields)
  const requiredEditableFields = editableFields.filter(([name]) => required.includes(name))
  const validationCheck =
    requiredEditableFields.length > 0
      ? requiredEditableFields
          .map(([name, prop]) => {
            const stateName = toCamelCase(name)
            if (prop.type === 'boolean') return null
            if (prop.type === 'integer' || prop.type === 'number') {
              return `${stateName} === ''`
            }
            return `!${stateName}.trim()`
          })
          .filter(Boolean)
          .join(' || ')
      : null

  return `'use client'

import { useState, useEffect } from 'react'

import { ${collectionName} } from '@/lib/db'
import { ${pascalName} } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface ${sheetComponentName}Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  item?: ${pascalName} | null
}

export function ${sheetComponentName}({ open, onOpenChange, mode, item }: ${sheetComponentName}Props) {
${stateDeclarations}

  const isCreate = mode === 'create'
  const title = isCreate ? 'Create New ${singularPascal}' : 'Edit ${singularPascal}'
  const description = isCreate
    ? 'Add a new ${singularName.replace(/_/g, ' ')} to your database.'
    : 'Update the ${singularName.replace(/_/g, ' ')} information.'
  const submitLabel = isCreate ? 'Create ${singularPascal}' : 'Save Changes'

  useEffect(() => {
    if (open) {
${useEffectReset}
    }
  }, [open, item])

  const handleSubmit = () => {
${validationCheck ? `    if (${validationCheck}) return\n` : ''}
    if (isCreate) {
      ${collectionName}.insert({
${insertData}
      })
    } else if (item) {
      ${collectionName}.update(item.${primaryKey}, (draft) => {
${updateData}
      })
    }

    handleClose()
  }

  const handleClose = () => {
${resetStates}
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* Read-only fields (only in edit mode) */}
          {!isCreate && item && (
            <>
${readOnlyFormFields}
            </>
          )}

          {/* Editable fields */}
${editableFormFields}
        </div>

        <SheetFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
`
}
