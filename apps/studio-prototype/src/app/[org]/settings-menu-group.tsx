import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { ClickCounter } from './click-counter'
import { SettingsGroupProps, SettingsItemProps } from './settings-menu-children'

export const SettingsGroup = ({
  group,
  items,
  basePath,
  hasBranchingEnabled,
}: SettingsGroupProps) => {
  return (
    <div
      className={cn(
        '',
        group === 'Project settings' && !hasBranchingEnabled ? 'mb-0' : 'mb-8',
        'transition-all',
        'duration-300',
        'delay-500'
      )}
    >
      {/* <ClickCounter /> */}
      <h2
        className={cn(
          'text-sm font-mono text-foreground-lighter/75 uppercase tracking-wide px-5',
          !hasBranchingEnabled && group === 'Environment settings'
            ? 'opacity-0 h-[0px]'
            : 'opacity-100 h-[18px]',
          'transition-all',
          'duration-300',
          'delay-500'
        )}
      >
        {group}
      </h2>
      <ul
        role="menu"
        className={cn(
          'mt-2',
          !hasBranchingEnabled && group === 'Environment settings' ? '!mt-0' : '',
          'transition-all',
          'duration-300',
          'delay-500'
        )}
      >
        {items.map((item) => (
          <SettingsItem key={item.key} item={item} basePath={basePath} />
        ))}
      </ul>
    </div>
  )
}

export const SettingsItem = ({ item, basePath }: SettingsItemProps) => {
  const fullPath = `${basePath}${item.href}`
  const pathname = usePathname()
  const isActive = pathname.startsWith(fullPath)

  return (
    <li key={item.key}>
      {/* <ClickCounter /> */}
      <Link
        href={fullPath}
        className={`pl-5 group/nav-item-anchor relative hover:text-foreground text-sm ${isActive ? 'text-foreground' : 'text-foreground-lighter'}`}
      >
        {item.label}
        <div
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2 h-2 w-[3px] rounded-r-full duration-300',
            'group-hover/nav-item-anchor:bg-foreground-muted group-hover/nav-item-anchor:left-0',
            isActive ? '!bg-foreground left-0 w-[5px] duration-100' : '-left-1',
            'transition-all'
          )}
        ></div>
      </Link>
      {item.items && (
        <ul role="menu" className="pl-5">
          {item.items.map((childItem) => (
            <SettingsItem key={childItem.key} item={childItem} basePath={basePath} />
          ))}
        </ul>
      )}
    </li>
  )
}
