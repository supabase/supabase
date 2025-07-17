'use client'

import { Button } from 'ui'
import { Input } from 'ui'
import { Textarea } from 'ui'
import { Label_Shadcn_ as Label } from 'ui'
import { X } from 'lucide-react'
import React from 'react'

interface ExperimentFormProps {
  mode: 'add' | 'edit'
  experiment: {
    name: string
    userPrompt: string
    expectedOutcome: string
  }
  onExperimentChange: (experiment: {
    name: string
    userPrompt: string
    expectedOutcome: string
  }) => void
  onSave: () => void
  onCancel: () => void
  isValid: boolean
}

export function ExperimentForm({
  mode,
  experiment,
  onExperimentChange,
  onSave,
  onCancel,
  isValid,
}: ExperimentFormProps) {
  // Remove title and saveText logic, handled by parent Dialog
  const saveText = mode === 'add' ? 'Add Experiment' : 'Save Changes'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="experiment-name">Experiment Name</Label>
        <Input
          id="experiment-name"
          placeholder="e.g., RLS Policy Creation, Edge Function Development"
          value={experiment.name}
          onChange={(e) => onExperimentChange({ ...experiment, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-prompt">User Prompt</Label>
        <Textarea
          id="user-prompt"
          placeholder="Enter the Supabase-related prompt to test"
          value={experiment.userPrompt}
          onChange={(e) => onExperimentChange({ ...experiment, userPrompt: e.target.value })}
          rows={3}
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="expected-outcome">Expected Outcome</Label>
        <Textarea
          id="expected-outcome"
          placeholder="Describe what the AI assistant should do (tools to use, code to generate, etc.)"
          value={experiment.expectedOutcome}
          onChange={(e) => onExperimentChange({ ...experiment, expectedOutcome: e.target.value })}
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button size="small" type="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="small" onClick={onSave} disabled={!isValid}>
          {saveText}
        </Button>
      </div>
    </div>
  )
}
