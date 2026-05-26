import { Alert, AlertDescription, AlertTitle, Button, CriticalIcon } from 'ui'

interface ViewAppSheetDangerZoneProps {
  onDelete: () => void
}

export function ViewAppSheetDangerZone({ onDelete }: ViewAppSheetDangerZoneProps) {
  return (
    <div className="px-5 sm:px-6 py-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Danger Zone</h3>
      <Alert variant="destructive">
        <CriticalIcon />
        <AlertTitle>Delete app</AlertTitle>
        <AlertDescription>Permanently delete this app and all its installations.</AlertDescription>
        <div className="mt-2">
          <Button type="danger" onClick={onDelete}>
            Delete app
          </Button>
        </div>
      </Alert>
    </div>
  )
}
