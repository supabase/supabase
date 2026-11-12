import type { Column } from '@supabase/mcp-server-supabase/apps'
import { KeyRoundIcon, LockKeyholeIcon } from 'lucide-react'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from 'ui'

import { defaultHint, isJsonColumn, type FieldDraft, type FieldMode } from './row-values'

interface RowFieldProps {
  id: string
  column: Column
  field: FieldDraft
  isPrimaryKey: boolean
  isEditable: boolean
  isBusy: boolean
  /** Inserts offer Default; updates do not. */
  isInsert: boolean
  onChange: (value: Partial<FieldDraft>) => void
}

const isFieldMode = (value: string): value is FieldMode =>
  value === 'value' || value === 'null' || value === 'default'

function FieldInput({
  id,
  column,
  field,
  isDisabled,
  onChange,
}: {
  id: string
  column: Column
  field: FieldDraft
  isDisabled: boolean
  onChange: (raw: string) => void
}) {
  const options = column.format === 'bool' ? ['true', 'false'] : column.enums
  if (options.length > 0) {
    return (
      <Select value={field.raw} disabled={isDisabled} onValueChange={onChange}>
        <SelectTrigger id={id} size="small" className="w-full">
          <SelectValue placeholder="Choose a value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  if (isJsonColumn(column)) {
    return (
      <Textarea
        id={id}
        spellCheck={false}
        className="min-h-24 font-mono text-xs"
        value={field.raw}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
  return (
    <Input
      id={id}
      size="small"
      value={field.raw}
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function RowField({
  id,
  column,
  field,
  isPrimaryKey,
  isEditable,
  isBusy,
  isInsert,
  onChange,
}: RowFieldProps) {
  const canChooseMode = isEditable && (column.nullable || isInsert)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
          {isPrimaryKey && (
            <KeyRoundIcon size={12} aria-label="Primary key" className="text-foreground-lighter" />
          )}
          <span className="truncate">{column.name}</span>
        </Label>
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-foreground-lighter">
          {column.format}
          {!isEditable && <LockKeyholeIcon size={12} aria-label="Not editable" />}
        </span>
      </div>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <FieldInput
            id={id}
            column={column}
            field={field}
            isDisabled={!isEditable || isBusy || field.mode !== 'value'}
            onChange={(raw) => onChange({ raw })}
          />
        </div>
        {canChooseMode && (
          <Select
            value={field.mode}
            disabled={isBusy}
            onValueChange={(mode) => {
              if (isFieldMode(mode)) onChange({ mode })
            }}
          >
            <SelectTrigger
              size="small"
              aria-label={`${column.name} value mode`}
              className="w-28 shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              {column.nullable && <SelectItem value="null">NULL</SelectItem>}
              {isInsert && <SelectItem value="default">Default</SelectItem>}
            </SelectContent>
          </Select>
        )}
      </div>
      {isInsert && field.mode === 'default' && (
        <p className="text-xs text-foreground-lighter">{defaultHint(column)}</p>
      )}
    </div>
  )
}
