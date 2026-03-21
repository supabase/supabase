import { Button } from 'ui'

export function AppInstallations() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Installations</h3>
      <div className="bg-surface-100 border border-default rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-foreground-light">This app hasn't been installed yet</p>
        <p className="text-xs text-foreground-muted max-w-sm">
          Install this app to specific projects to start generating tokens
        </p>
        <Button type="default" disabled>
          Create installation
        </Button>
      </div>
    </div>
  )
}
