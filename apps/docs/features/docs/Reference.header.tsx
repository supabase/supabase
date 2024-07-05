import { Github } from 'lucide-react'
import Link from 'next/link'

import { cn } from 'ui'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'

interface ClientLibHeaderProps {
  menuData: {
    title: string
    icon?: string
    pkg: {
      name: string
      repo: string
    }
  }
  className?: string
}

function ClientLibHeader({ menuData, className }: ClientLibHeaderProps) {
  return (
    <div className={cn('flex items-start gap-6', className)}>
      {'icon' in menuData && (
        <MenuIconPicker
          icon={menuData.icon}
          width={35}
          height={35}
          className="text-foreground-light"
        />
      )}
      <div className="flex flex-col gap-2">
        <h1 id="introduction" className="text-3xl text-foreground">
          {menuData.title} Client Library
        </h1>
        <span
          className={cn('text-base font-mono text-foreground-light', 'flex items-center gap-2')}
        >
          {menuData.pkg.name}
          <Link
            href={menuData.pkg.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-brand focus-visible:text-brand transition-colors"
          >
            <Github size={18} />
          </Link>
        </span>
      </div>
    </div>
  )
}

export { ClientLibHeader }
