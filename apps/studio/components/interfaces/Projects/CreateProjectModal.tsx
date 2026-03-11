import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'

const PROJECT_NAME_REGEX = /^[a-z][a-z0-9_]*$/

function validateProjectName(name: string): string | null {
  if (!name) {
    return 'Project name is required'
  }
  if (name.length > 59) {
    return 'Project name must be 59 characters or fewer'
  }
  if (!PROJECT_NAME_REGEX.test(name)) {
    return 'Project name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores'
  }
  return null
}

export interface CreateProjectModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export const CreateProjectModal = ({ visible, onClose, onSuccess }: CreateProjectModalProps) => {
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setName('')
    setValidationError(null)
    setSubmitError(null)
    onClose()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose()
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (validationError) {
      setValidationError(validateProjectName(value))
    }
  }

  const handleSubmit = async () => {
    const error = validateProjectName(name)
    if (error) {
      setValidationError(error)
      return
    }

    setIsLoading(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/platform/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message = (data as any)?.message || (data as any)?.error || 'Failed to create project'
        setSubmitError(message)
        return
      }

      handleClose()
      onSuccess()
    } catch (_err) {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
        </DialogHeader>

        <DialogSection className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label_Shadcn_ htmlFor="project-name">Project name</Label_Shadcn_>
            <Input_Shadcn_
              id="project-name"
              placeholder="e.g. acme"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && name) {
                  handleSubmit()
                }
              }}
            />
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : (
              <p className="text-xs text-foreground-lighter">
                Lowercase letters, numbers, and underscores only. Max 59 characters.
              </p>
            )}
          </div>

          {submitError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {submitError}
            </div>
          )}
        </DialogSection>

        <DialogFooter>
          <Button type="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !name}
          >
            {isLoading ? 'Creating...' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
