import { cn } from '../../lib/utils'

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

/**
 * A component to display a keyboard shortcut.
 * It automatically replaces 'Meta' with '⌘' on Mac and 'Ctrl' on other OSes.
 * It also replaces 'Shift' with '⇧'.
 * @param {object} props - The component props.
 * @param {string[]} props.keys - An array of keys to display.
 * @returns {React.ReactElement} The keyboard shortcut component.
 */
export const KeyboardShortcut = ({ keys }: { keys: string[] }) => {
  const isMac = getIsMac()
  const keysWithMeta = keys.map((key) => (key === 'Meta' ? (isMac ? '⌘' : 'Ctrl') : key))
  const keysWithMetaAndShift = keysWithMeta.map((key) => (key === 'Shift' ? '⇧' : key))

  return (
    <div className="text-xs text-foreground-light flex items-center gap-[3px]">
      {keysWithMetaAndShift.map((key) => (
        <span
          className={cn(
            ['Shift', 'Ctrl'].includes(key) ? 'px-1.5 py-0.5' : 'w-[23px] h-[23px]',
            'border border-foreground-lightest',
            'rounded flex items-center justify-center cursor-default'
          )}
          key={key}
        >
          {key}
        </span>
      ))}
    </div>
  )
}
