import { KeyboardShortcut } from 'ui'

const shortcuts = [
  { label: 'Open command menu', keys: ['Meta', 'K'] },
  { label: 'Prettify SQL', keys: ['Alt', 'Shift', 'F'] },
  { label: 'Download Markdown', keys: ['Shift', 'Meta', 'M'] },
]

export default function KeyboardShortcutPill() {
  return (
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
  )
}
