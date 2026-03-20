import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { usePlatformAppInstallationCreateMutation } from 'data/platform-apps/platform-app-installation-create-mutation'
import { usePrivateApps } from './PrivateAppsContext'

interface CreateInstallationModalProps {
  visible: boolean
  onClose: () => void
}

export function CreateInstallationModal({ visible, onClose }: CreateInstallationModalProps) {
  const { slug, apps, installations, addInstallation } = usePrivateApps()

  const installedAppIds = new Set(installations.map((i) => i.app_id))
  const availableApps = apps.filter((a) => !installedAppIds.has(a.id))

  const { mutate: installApp, isPending: isInstalling } = usePlatformAppInstallationCreateMutation({
    onSuccess: (data) => {
      const appName = availableApps.find((a) => a.id === selectedAppId)?.name
      if (data) {
        addInstallation(data, 'all')
      } else {
        console.warn('[CreateInstallationModal] POST succeeded but response body was empty')
      }
      toast.success(`${appName ?? 'App'} installed successfully`)
      setSelectedAppId('')
      onClose()
    },
  })

  const [selectedAppId, setSelectedAppId] = useState('')

  function handleClose() {
    setSelectedAppId('')
    onClose()
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Install app</DialogTitle>
          <DialogDescription>
            Install a private app to grant it access to your organization.
          </DialogDescription>
        </DialogHeader>

        <DialogSection className="space-y-2">
          <Label_Shadcn_>Select app</Label_Shadcn_>
          {availableApps.length === 0 ? (
            <p className="text-sm text-foreground-light">
              {apps.length === 0
                ? 'No private apps available. Create an app first.'
                : 'All apps are already installed in this organization.'}
            </p>
          ) : (
            <Select_Shadcn_ value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger_Shadcn_>
                <SelectValue_Shadcn_ placeholder="Choose an app..." />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {availableApps.map((app) => (
                  <SelectItem_Shadcn_ key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          )}
        </DialogSection>

        <DialogFooter>
          <Button type="default" onClick={handleClose} disabled={isInstalling}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={!selectedAppId}
            loading={isInstalling}
            onClick={() => slug && installApp({ slug, app_id: selectedAppId })}
          >
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
