import Link from 'next/link'

import { cn } from 'ui'

interface SettingsMenuItemProps {
  href: string
  label: string
  isActive: boolean
}

const SettingsMenuItem = ({ href, label, isActive }: SettingsMenuItemProps) => {
  return (
    <div>
      <Link
        href={href}
        className={cn(
          'text-sm',
          isActive ? 'text-foreground' : 'text-foreground-light hover:text-foreground transition'
        )}
      >
        {label}
      </Link>
    </div>
  )
}

export default SettingsMenuItem
