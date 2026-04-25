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

const KEY_SYMBOLS: Record<string, string | ((isMac: boolean) => string)> = {
  Meta: (isMac) => (isMac ? '⌘' : 'Ctrl'),
  Alt: (isMac) => (isMac ? '⌥' : 'Alt'),
  Shift: '⇧',
  Enter: '↵',
  Esc: 'Esc', // ⎋ symbol not recognisable enough
  Escape: 'Esc', // Match above
  Tab: 'Tab', // ⇥ symbol not recognisable enough
}

type KeyboardShortcutProps = {
  keys: string[]
  variant?: 'pill' | 'inline'
  className?: string
}

const resolveKeyLabel = (key: string, isMac: boolean) => {
  const symbol = KEY_SYMBOLS[key]
  const resolvedKey = typeof symbol === 'function' ? symbol(isMac) : (symbol ?? key)

  return resolvedKey.length === 1 ? resolvedKey.toUpperCase() : resolvedKey
}

export const KeyboardShortcut = ({ keys, variant = 'pill', className }: KeyboardShortcutProps) => {
  const isMac = getIsMac()
  const resolvedKeys = keys.map((key) => resolveKeyLabel(key, isMac))
  const shortcutLabel = resolvedKeys.join(' ')

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap shrink-0',
        variant === 'pill'
          ? 'items-center text-[11px] leading-none -tracking-[0.05em] text-foreground-light bg-surface-200 dark:bg-surface-100 rounded px-[5px] py-[3px]'
          : 'items-baseline text-[11px] leading-[inherit] text-foreground/40',
        className
      )}
    >
      {shortcutLabel}
    </span>
  )
}
