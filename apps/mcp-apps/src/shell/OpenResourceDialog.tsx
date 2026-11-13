import { useRef, useState } from 'react'
import { errorMessage } from 'surfaces/common'
import type { Bootstrap } from 'surfaces/contract'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useApp } from '../host/app-context'

type ResourceKind = 'project_ref' | 'organization_slug'

/** Opens a project or organization directly, for scoped tokens that cannot list the account. */
export function OpenResourceDialog({
  onClose,
  onOpened,
}: {
  onClose: () => void
  onOpened: (data: Bootstrap) => void
}) {
  const data = useApp().data
  const [kind, setKind] = useState<ResourceKind>('project_ref')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const submitting = useRef(false)
  const isProject = kind === 'project_ref'

  async function handleSubmit() {
    if (submitting.current) return
    submitting.current = true
    setIsBusy(true)
    setError('')
    try {
      onOpened(await data.bootstrap({ [kind]: value.trim() }))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      submitting.current = false
      setIsBusy(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isBusy) onClose()
      }}
    >
      <DialogContent hideClose={isBusy}>
        <DialogHeader>
          <DialogTitle>Open project or organization</DialogTitle>
        </DialogHeader>
        <DialogSection>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmit()
            }}
          >
            <p className="text-sm text-foreground-light">
              Open a resource your token can access without listing your whole account. Your token’s
              permissions still apply.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="open-resource-kind">Resource</Label>
              <Select
                value={kind}
                disabled={isBusy}
                onValueChange={(next) => {
                  setKind(next === 'organization_slug' ? 'organization_slug' : 'project_ref')
                  setValue('')
                  setError('')
                }}
              >
                <SelectTrigger id="open-resource-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_ref">Project</SelectItem>
                  <SelectItem value="organization_slug">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="open-resource-value">
                {isProject ? 'Project reference' : 'Organization slug'}
              </Label>
              <Input
                id="open-resource-value"
                required
                autoFocus
                maxLength={100}
                value={value}
                disabled={isBusy}
                onChange={(event) => setValue(event.target.value)}
                placeholder={isProject ? 'Your project ref' : 'Your organization slug'}
              />
              <p className="text-xs text-foreground-lighter">
                Find this in your Supabase dashboard URL, after /project/ or /org/.
              </p>
            </div>
            {error && (
              <Admonition
                type="warning"
                title={`Failed to open ${kind === 'project_ref' ? 'project' : 'organization'}`}
                description={`Error: ${error}`}
              />
            )}
            <DialogFooter className="px-0 pb-0">
              <Button variant="default" type="button" disabled={isBusy} onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isBusy || !value.trim()}>
                {isBusy ? 'Opening…' : 'Open'}
              </Button>
            </DialogFooter>
          </form>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
