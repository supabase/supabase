import { Button, KeyboardShortcut } from 'ui'

const shortcuts = [
  { label: 'Open command menu', keys: ['Meta', 'K'] },
  { label: 'Prettify SQL', keys: ['Alt', 'Shift', 'F'] },
  { label: 'Download CSV', keys: ['Shift', 'Meta', 'D'] },
]

export default function KeyboardShortcutDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button iconRight={<KeyboardShortcut keys={['Meta', 'S']} variant="inline" />}>Save</Button>
        <Button
          type="default"
          iconRight={<KeyboardShortcut keys={['Meta', 'Enter']} variant="inline" />}
        >
          Run query
        </Button>
      </div>

      <div className="w-full max-w-md rounded-lg border bg-background p-1.5">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.label}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
          >
            <span>{shortcut.label}</span>
            <KeyboardShortcut keys={shortcut.keys} />
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        Hit <KeyboardShortcut keys={['Meta', 'K']} variant="inline" /> to open search
      </p>
    </div>
  )
}
