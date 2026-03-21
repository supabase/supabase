import { RotateCcw, Trash } from 'lucide-react'
import { Button } from 'ui'

interface AppDangerZoneProps {
  onDelete: () => void
}

export function AppDangerZone({ onDelete }: AppDangerZoneProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
      <div className="border border-destructive/30 rounded-lg divide-y divide-default">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div>
            <p className="text-sm font-medium">Rotate key pair</p>
            <p className="text-xs text-foreground-light">
              Generate a new key pair and invalidate the current private key
            </p>
          </div>
          <Button type="default" icon={<RotateCcw size={14} />} disabled>
            Rotate key
          </Button>
        </div>
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div>
            <p className="text-sm font-medium">Delete app</p>
            <p className="text-xs text-foreground-light">
              Permanently delete this app and all its installations
            </p>
          </div>
          <Button type="danger" icon={<Trash size={14} />} onClick={onDelete}>
            Delete app
          </Button>
        </div>
      </div>
    </div>
  )
}
