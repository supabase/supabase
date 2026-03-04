import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Label_Shadcn_,
  RadioGroupItem_Shadcn_,
  RadioGroup_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { MOCK_PERMISSIONS, MOCK_PROJECTS } from './PrivateApps.constants'
import { Installation, usePrivateApps } from './PrivateAppsContext'

interface CreateInstallationModalProps {
  visible: boolean
  onClose: () => void
  onCreated: (installation: Installation) => void
}

export function CreateInstallationModal({
  visible,
  onClose,
  onCreated,
}: CreateInstallationModalProps) {
  const { apps, createInstallation } = usePrivateApps()
  const [selectedAppId, setSelectedAppId] = useState('')
  const [scopeType, setScopeType] = useState<'all' | 'selected'>('all')
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())

  function reset() {
    setSelectedAppId('')
    setScopeType('all')
    setSelectedProjects(new Set())
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleInstall() {
    const projectScope: 'all' | string[] =
      scopeType === 'all' ? 'all' : Array.from(selectedProjects)
    const installation = createInstallation({ appId: selectedAppId, projectScope })
    reset()
    onCreated(installation)
  }

  function toggleProject(id: string) {
    setSelectedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectedApp = apps.find((a) => a.id === selectedAppId)

  const canInstall =
    selectedAppId !== '' &&
    (scopeType === 'all' || selectedProjects.size > 0)

  const appPermissions = selectedApp
    ? selectedApp.permissions
        .map((id) => MOCK_PERMISSIONS.find((p) => p.id === id))
        .filter(Boolean)
    : []

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Install app</DialogTitle>
          <DialogDescription>
            Install a private app to grant it access to projects in your organization.
          </DialogDescription>
        </DialogHeader>

        <DialogSection className="space-y-5">
          {/* App selector */}
          <div className="space-y-2">
            <Label_Shadcn_>Select app</Label_Shadcn_>
            {apps.length === 0 ? (
              <p className="text-sm text-foreground-light">
                No private apps available. Create an app first.
              </p>
            ) : (
              <Select_Shadcn_
                value={selectedAppId}
                onValueChange={setSelectedAppId}
              >
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Choose an app..." />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {apps.map((app) => (
                    <SelectItem_Shadcn_ key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            )}
          </div>

          {/* Permissions preview */}
          {selectedApp && appPermissions.length > 0 && (
            <div className="space-y-2">
              <Label_Shadcn_>Permissions requested by this app</Label_Shadcn_>
              <div className="rounded-md border border-control bg-surface-100 p-3 space-y-1 max-h-36 overflow-y-auto">
                {appPermissions.map((p) => (
                  <div key={p!.id} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-foreground-light">{p!.label}</span>
                    <span className="text-xs text-foreground-muted">— {p!.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project scope */}
          <div className="space-y-3">
            <Label_Shadcn_>Project scope</Label_Shadcn_>
            <RadioGroup_Shadcn_
              value={scopeType}
              onValueChange={(v) => setScopeType(v as 'all' | 'selected')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem_Shadcn_ value="all" id="scope-all" />
                <Label_Shadcn_ htmlFor="scope-all" className="cursor-pointer font-normal">
                  All projects in organization
                </Label_Shadcn_>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem_Shadcn_ value="selected" id="scope-selected" />
                <Label_Shadcn_ htmlFor="scope-selected" className="cursor-pointer font-normal">
                  Selected projects
                </Label_Shadcn_>
              </div>
            </RadioGroup_Shadcn_>

            {scopeType === 'selected' && (
              <div className="ml-6 space-y-2 rounded-md border border-control p-3">
                {MOCK_PROJECTS.map((project) => (
                  <label key={project.id} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox_Shadcn_
                      id={project.id}
                      checked={selectedProjects.has(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <Label_Shadcn_ htmlFor={project.id} className="cursor-pointer font-normal">
                      {project.name}
                    </Label_Shadcn_>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          {selectedApp && (
            <p className="text-xs text-foreground-muted">
              This installation will grant all requested permissions to the selected projects.
            </p>
          )}
        </DialogSection>

        <DialogFooter>
          <Button type="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="primary" disabled={!canInstall} onClick={handleInstall}>
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
