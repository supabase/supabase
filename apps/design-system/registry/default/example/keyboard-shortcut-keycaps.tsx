import { KeyboardShortcut } from 'ui'

export default function KeyboardShortcutKeycaps() {
  return (
    <div className="flex h-[30px] w-64 items-center justify-between rounded-md border bg-surface-75 pl-2 pr-1.5 text-sm text-foreground-lighter">
      Search
      <KeyboardShortcut keys={['Meta', 'K']} variant="keycaps" />
    </div>
  )
}
