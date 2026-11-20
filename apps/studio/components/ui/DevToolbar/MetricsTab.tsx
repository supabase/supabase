'use client'

import { useParams } from 'common'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import { setMemoryCommitmentPreview, useMemoryCommitmentPreview } from '@/state/metrics-preview'

const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_ENABLED = env === 'local' || env === 'staging'
const OPTIONS = [
  { value: 'default', label: 'Default (real data)' },
  { value: 'warn', label: 'Warn' },
  { value: 'problematic', label: 'Problematic' },
  { value: 'severe', label: 'Severe' },
] as const

export const MetricsTab = () => {
  const { ref } = useParams()
  const preview = useMemoryCommitmentPreview(ref)
  if (!IS_ENABLED) return null

  const handlePreviewChange = (value: string) => {
    const option = OPTIONS.find((option) => option.value === value)
    if (ref && option) setMemoryCommitmentPreview(ref, option.value)
  }

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-foreground-light">
        Preview metrics with simulated data. Default restores real data.
      </p>
      {!ref && <p className="text-xs text-foreground-muted">Open a project to preview metrics.</p>}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="memory-commitment-preview" className="text-sm text-foreground-light">
          Memory commitment
        </label>
        <Select value={preview} onValueChange={handlePreviewChange} disabled={!ref}>
          <SelectTrigger id="memory-commitment-preview" className="w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {preview !== 'default' && (
        <p className="text-xs text-warning-600">Simulated data is active for this project.</p>
      )}
    </div>
  )
}
