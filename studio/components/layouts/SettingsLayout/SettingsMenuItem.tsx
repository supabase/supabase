import clsx from 'clsx'
import Link from 'next/link'

interface SettingsMenuItemProps {
  href: string
  label: string
  isActive: boolean
}

const SettingsMenuItem = ({ href, label, isActive }: SettingsMenuItemProps) => {
  return (
    <div>
      <Link href={href}>
        <a
          className={clsx(
            'text-sm',
            isActive ? 'text-scale-1200' : 'text-scale-1100 hover:text-scale-1200 transition'
          )}
        >
          {label}
        </a>
      </Link>
    </div>
  )
}

export default SettingsMenuItem
