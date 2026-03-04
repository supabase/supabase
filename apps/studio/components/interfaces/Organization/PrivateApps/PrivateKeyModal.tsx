import { AlertTriangle, Copy, Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
} from 'ui'
import { PrivateApp } from './PrivateAppsContext'

interface PrivateKeyModalProps {
  app: PrivateApp | null
  privateKey: string
  visible: boolean
  onDone: () => void
}

export function PrivateKeyModal({ app, privateKey, visible, onDone }: PrivateKeyModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  function handleDone() {
    setConfirmed(false)
    onDone()
  }

  function handleCopy() {
    navigator.clipboard.writeText(privateKey)
    toast.success('Private key copied to clipboard')
  }

  function handleDownload() {
    if (!app) return
    const blob = new Blob([privateKey], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.name.toLowerCase().replace(/\s+/g, '-')}-private-key.pem`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        // Cannot be dismissed until confirmed
        if (!open && !confirmed) return
        if (!open) handleDone()
      }}
    >
      <DialogContent size="medium" hideClose={!confirmed}>
        <DialogHeader>
          <DialogTitle>Save your private key</DialogTitle>
        </DialogHeader>

        <DialogSection className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-warning bg-warning/10 p-3">
            <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Save this private key now. You won't be able to see it again.
              </p>
              <p className="text-foreground-light mt-1">
                Store it securely — it's required to generate access tokens for this app.
              </p>
            </div>
          </div>

          {app && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground-light w-20">App name</span>
                <span className="font-medium">{app.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground-light w-20">Client ID</span>
                <span className="font-mono text-xs">{app.clientId}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Private key</p>
              <div className="flex items-center gap-2">
                <Button
                  type="default"
                  size="tiny"
                  icon={<Copy size={12} />}
                  onClick={handleCopy}
                >
                  Copy
                </Button>
                <Button
                  type="default"
                  size="tiny"
                  icon={<Download size={12} />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={privateKey}
              rows={10}
              className="w-full rounded-md border border-control bg-surface-100 px-3 py-2 text-xs font-mono resize-none focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox_Shadcn_
              id="key-confirmed"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(Boolean(v))}
            />
            <Label_Shadcn_ htmlFor="key-confirmed" className="cursor-pointer">
              I have saved this private key
            </Label_Shadcn_>
          </label>
        </DialogSection>

        <DialogFooter>
          <Button type="primary" disabled={!confirmed} onClick={handleDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
