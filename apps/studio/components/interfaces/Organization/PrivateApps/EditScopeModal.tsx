import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Label_Shadcn_,
  RadioGroupItem_Shadcn_,
  RadioGroup_Shadcn_,
} from 'ui'
import { MOCK_PROJECTS } from './PrivateApps.constants'
import { Installation, usePrivateApps } from './PrivateAppsContext'

interface EditScopeModalProps {
  installation: Installation | null
  visible: boolean
  onClose: () => void
}

export function EditScopeModal({ installation, visible, onClose }: EditScopeModalProps) {
  const { updateInstallationScope } = usePrivateApps()

  const currentScope = installation?.projectScope ?? 'all'
  const [scopeType, setScopeType] = useState<'all' | 'selected'>(
    currentScope === 'all' ? 'all' : 'selected'
  )
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(currentScope === 'all' ? [] : (currentScope as string[]))
  )

  // Sync when installation changes
  function initState() {
    const scope = installation?.projectScope ?? 'all'
    setScopeType(scope === 'all' ? 'all' : 'selected')
    setSelectedProjects(new Set(scope === 'all' ? [] : (scope as string[])))
  }

  function handleClose() {
    initState()
    onClose()
  }

  function handleSave() {
    if (!installation) return
    const projectScope: 'all' | string[] =
      scopeType === 'all' ? 'all' : Array.from(selectedProjects)
    updateInstallationScope(installation.id, projectScope)
    onClose()
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

  const canSave = scopeType === 'all' || selectedProjects.size > 0

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Edit project scope</DialogTitle>
        </DialogHeader>

        <DialogSection className="space-y-4">
          <RadioGroup_Shadcn_
            value={scopeType}
            onValueChange={(v) => setScopeType(v as 'all' | 'selected')}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem_Shadcn_ value="all" id="edit-scope-all" />
              <Label_Shadcn_ htmlFor="edit-scope-all" className="cursor-pointer font-normal">
                All projects in organization
              </Label_Shadcn_>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem_Shadcn_ value="selected" id="edit-scope-selected" />
              <Label_Shadcn_ htmlFor="edit-scope-selected" className="cursor-pointer font-normal">
                Selected projects
              </Label_Shadcn_>
            </div>
          </RadioGroup_Shadcn_>

          {scopeType === 'selected' && (
            <div className="ml-6 space-y-2 rounded-md border border-control p-3">
              {MOCK_PROJECTS.map((project) => (
                <label key={project.id} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox_Shadcn_
                    id={`edit-${project.id}`}
                    checked={selectedProjects.has(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  <Label_Shadcn_
                    htmlFor={`edit-${project.id}`}
                    className="cursor-pointer font-normal"
                  >
                    {project.name}
                  </Label_Shadcn_>
                </label>
              ))}
            </div>
          )}
        </DialogSection>

        <DialogFooter>
          <Button type="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="primary" disabled={!canSave} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
