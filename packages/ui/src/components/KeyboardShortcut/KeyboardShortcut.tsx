const getIsMac = () => {
  if (typeof navigator === 'undefined') return false

  if (navigator.userAgent && navigator.userAgent.includes('Mac')) {
    return true
  }

  if (navigator.platform) {
    return navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone'
  }
  return false
}

export const KeyboardShortcut = ({ keys }: { keys: string[] }) => {
  const isMac = getIsMac()
  const keysWithMeta = keys.map((key) => (key === 'Meta' ? (isMac ? '⌘' : 'Ctrl') : key))
  const keysWithMetaAndShift = keysWithMeta.map((key) => (key === 'Shift' ? '⇧' : key))

  return (
    <div className="text-xs text-foreground-light flex items-center gap-[3px]">
      {keysWithMetaAndShift.map((key) => (
        <span
          className="px-1.5 py-0.5 rounded-sm border-b-2 flex items-center justify-center border border-foreground-lightest cursor-default"
          key={key}
        >
          {key}
        </span>
      ))}
    </div>
  )
}
