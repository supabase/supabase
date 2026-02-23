import { useState } from 'react'
import { Button, Input, Label_Shadcn_ as Label } from 'ui'

interface ReportVariablesProps {
  variables: string[]
  values: Record<string, string>
  onApply: (values: Record<string, string>) => void
}

export const ReportVariables = ({ variables, values, onApply }: ReportVariablesProps) => {
  const [draft, setDraft] = useState<Record<string, string>>(values)

  const hasChanges = variables.some((name) => (draft[name] ?? '') !== (values[name] ?? ''))

  const handleChange = (name: string, value: string) => {
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

  if (variables.length === 0) return null

  return (
    <div className="flex items-center gap-4">
      {variables.map((name) => (
        <div key={name} className="flex items-center gap-4">
          <Label className="text-xs text-foreground-light font-mono uppercase">{name}</Label>
          <Input
            size="tiny"
            className="w-36"
            placeholder={`:${name}`}
            value={draft[name] ?? ''}
            onChange={(e) => handleChange(name, e.target.value)}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <Button
          type="primary"
          size="tiny"
          disabled={!hasChanges}
          onClick={() => onApply({ ...draft })}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
