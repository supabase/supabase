import { Button, KeyboardShortcut } from 'ui'

export default function KeyboardShortcutInline() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button iconRight={<KeyboardShortcut keys={['Meta', 'S']} variant="inline" />}>Save</Button>
        <Button
          type="default"
          iconRight={<KeyboardShortcut keys={['Meta', 'Enter']} variant="inline" />}
        >
          Apply
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        Hit <KeyboardShortcut keys={['Meta', 'K']} variant="inline" /> to edit with the Assistant
      </p>
    </div>
  )
}
