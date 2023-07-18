import clsx from 'clsx'
import Link from 'next/link'

interface OrganizationSettingsMenuItemProps {
  slug: string
  link: { label: string; pathname: string }
  isActive: boolean
}

const OrganizationSettingsMenuItem = ({
  slug,
  link,
  isActive,
}: OrganizationSettingsMenuItemProps) => {
  return (
    <div>
      <Link href={link.pathname.replace('[slug]', slug)}>
        <a
          className={clsx(
            'text-sm',
            isActive ? 'text-scale-1200' : 'text-scale-1100 hover:text-scale-1200 transition'
          )}
        >
          {link.label}
        </a>
      </Link>
    </div>
  )
}

export default OrganizationSettingsMenuItem
