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
  Textarea,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useApp } from '../host/app-context'
import { projectSetupPrompt } from '../host/project-setup-prompt'

/**
 * Collects a project brief and hands it to the active agent. The form never
 * creates a project itself: the agent follows the server's cost confirmation.
 */
export function CreateProjectDialog({
  data,
  onClose,
  onSent,
}: {
  data: Bootstrap
  onClose: () => void
  onSent: () => void
}) {
  const host = useApp().agent
  const [name, setName] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [region, setRegion] = useState('')
  const [description, setDescription] = useState('')
  const [folder, setFolder] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const organization = data.organizations.find((o) => o.id === organizationId)
  const canSend =
    !!host.ask &&
    data.capabilities.createProject &&
    !!name.trim() &&
    !!description.trim() &&
    !!organization &&
    data.regions.includes(region)

  async function handleSubmit() {
    if (lock.current || !canSend || !organization || !host.ask) return
    lock.current = true
    setIsBusy(true)
    setError('')
    try {
      await host.ask(projectSetupPrompt({ name, description, organization, region, folder }, data))
      onSent()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      lock.current = false
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
          <DialogTitle>Create a project</DialogTitle>
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
              Describe what you want to build.{' '}
              {host.agentName === 'agent' ? 'Your agent' : host.agentName} will create your Supabase
              project, set up a local folder, and start implementing it in your active chat.
            </p>
            <Field label="Organization" htmlFor="create-organization">
              <Select value={organizationId} disabled={isBusy} onValueChange={setOrganizationId}>
                <SelectTrigger id="create-organization">
                  <SelectValue placeholder="Choose an organization" />
                </SelectTrigger>
                <SelectContent>
                  {data.organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Project name" htmlFor="create-name">
                <Input
                  id="create-name"
                  autoFocus
                  required
                  maxLength={100}
                  value={name}
                  disabled={isBusy}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="My project"
                />
              </Field>
              <Field label="Region" htmlFor="create-region">
                <Select value={region} disabled={isBusy} onValueChange={setRegion}>
                  <SelectTrigger id="create-region">
                    <SelectValue placeholder="Choose a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Describe the project" htmlFor="create-description">
              <Textarea
                id="create-description"
                required
                rows={4}
                maxLength={8000}
                value={description}
                disabled={isBusy}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What should it do, who is it for, and which features should it include?"
              />
            </Field>
            <Field label="Local folder (optional)" htmlFor="create-folder">
              <Input
                id="create-folder"
                maxLength={1024}
                value={folder}
                disabled={isBusy}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="Let the agent choose a project folder"
              />
            </Field>
            {!host.ask && !host.isPreview && (
              <p className="text-xs text-foreground-lighter" role="status">
                This host doesn’t support sending project briefs to an agent.
              </p>
            )}
            {!data.organizations.length && (
              <Admonition
                type="warning"
                title="No organizations available"
                description="Join or create an organization in Supabase first."
              />
            )}
            {error && (
              <Admonition
                type="destructive"
                title="Failed to send project brief"
                description={error}
              />
            )}
            <DialogFooter className="px-0 pb-0">
              <Button variant="default" type="button" onClick={onClose} disabled={isBusy}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isBusy || !canSend}>
                {isBusy
                  ? 'Sending…'
                  : `Build with ${host.agentName === 'agent' ? 'agent' : host.agentName}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
