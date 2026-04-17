import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  CriticalIcon,
} from 'ui'

interface ViewAppSheetDangerZoneProps {
  onDelete: () => void
}

export function ViewAppSheetDangerZone({ onDelete }: ViewAppSheetDangerZoneProps) {
  return (
    <div className="px-5 sm:px-6 py-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Danger Zone</h3>
      <Alert_Shadcn_ variant="destructive">
        <CriticalIcon />
        <AlertTitle_Shadcn_>Delete app</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          Permanently delete this app and all its installations.
        </AlertDescription_Shadcn_>
        <div className="mt-2">
          <Button type="danger" onClick={onDelete}>
            Delete app
          </Button>
        </div>
      </Alert_Shadcn_>
    </div>
  )
}
