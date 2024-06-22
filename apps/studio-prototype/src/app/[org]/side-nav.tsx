import {
  Auth,
  EdgeFunctions,
  Postgres,
  Realtime,
  Reports,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { Bolt, Database, Settings } from 'lucide-react'
import { cn } from 'ui'
import UserMenu from './user-menu'

export default function SideNav() {
  const STROKE_WIDTH = 1
  const ICON_SIZE = 19
  const iconsClasses = cn('text-foreground-muted hover:text-foreground-lighter transition-all')

  const supabaseProducts = [
    {
      name: 'Table Editor',
      label: 'Table Editor',
      icon: <TableEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/auth',
    },
    {
      name: 'SQL Editor',
      label: 'SQL Editor',
      icon: <SqlEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/auth',
    },
    {
      name: 'Supabase Auth',
      label: 'Auth',
      icon: <Auth strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/auth',
    },
    {
      name: 'Supabase Database',
      label: 'Database',
      icon: <Database strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/database',
    },
    {
      name: 'Supabase Storage',
      label: 'Storage',
      icon: <Storage strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/storage',
    },
    {
      name: 'Supabase Functions',
      label: 'Functions',
      icon: <EdgeFunctions strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/functions',
    },
    {
      name: 'Supabase Realtime',
      label: 'Realtime',
      icon: <Realtime strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/realtime',
    },
    {
      name: 'Supabase Scheduled',
      label: 'Scheduled',
      icon: <Reports strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/scheduled',
    },
    {
      name: 'Supabase Usage',
      label: 'Usage',
      icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/usage',
    },
    {
      name: 'Supabase Settings',
      label: 'Settings',
      icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/settings',
    },
  ]

  return (
    <div
      className={cn(
        'w-12 bg-200 border-r flex flex-col py-[10px] px-2',
        // 'hover:w-32 px-5',
        'items-center',
        'transition-all'
      )}
    >
      <div
        className={cn(
          'w-[26px] h-[26px] border bg-foreground rounded-md',
          'flex items-center justify-center text-background text-xs font-semibold'
        )}
      >
        SM
      </div>
      <div className="grow">
        {supabaseProducts.map((product) => (
          <a key={product.name} href={product.href} className="flex flex-col items-center mt-6">
            {product.icon}
            {/* <span className="text-xs mt-1">{product.label}</span> */}
          </a>
        ))}
      </div>
      <UserMenu />
    </div>
  )
}
