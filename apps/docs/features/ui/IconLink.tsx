import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import Link from 'next/link'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from 'ui'

const sizeStyles = {
  sm: {
    tile: 'h-10 w-10',
    image: 'w-5',
  },
  lg: {
    tile: 'h-10 w-10 sm:h-16 sm:w-16',
    image: 'w-5 sm:w-8',
  },
} as const

export type IconLinkSize = keyof typeof sizeStyles

export type IconLinkItem = {
  title: string
  href: string
  icon: ReactNode
  className?: string
}

const iconLinkClassName =
  'group relative -m-3 flex items-center gap-3 rounded-xl p-3 no-underline transition-colors hover:bg-accent focus-ring focus-visible:bg-accent'

function IconLinkContent({
  title,
  icon,
  size = 'sm',
}: {
  title: string
  icon: ReactNode
  size?: IconLinkSize
}) {
  return (
    <>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-100 transition-colors group-hover:border-strong group-focus-visible:border-strong',
          sizeStyles[size].tile
        )}
      >
        {icon}
      </div>
      <span className="text-base text-foreground">{title}</span>
    </>
  )
}

export function IconLink({
  href,
  title,
  icon,
  size = 'sm',
  className,
}: {
  href: string
  title: string
  icon: ReactNode
  size?: IconLinkSize
  className?: string
}) {
  return (
    <Link href={href} className={cn(iconLinkClassName, className)}>
      <IconLinkContent title={title} icon={icon} size={size} />
    </Link>
  )
}

export function IconLinkButton({
  title,
  icon,
  size = 'sm',
  className,
  disabled,
  tabIndex,
  ...props
}: {
  title: string
  icon: ReactNode
  size?: IconLinkSize
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      tabIndex={tabIndex ?? (disabled ? -1 : 0)}
      className={cn(iconLinkClassName, 'w-full text-left', className)}
      {...props}
    >
      <IconLinkContent title={title} icon={icon} size={size} />
    </button>
  )
}

export function IconLinkList({
  items,
  labelledBy,
  label,
  className,
  itemClassName = 'col-span-6 md:col-span-4',
  size = 'sm',
}: {
  items: IconLinkItem[]
  /** Prefer when a visible heading is the list’s name. */
  labelledBy?: string
  /** Prefer when the nearby heading is section/setup copy, not a list title. */
  label?: string
  className?: string
  itemClassName?: string
  size?: IconLinkSize
}) {
  return (
    <ul
      className={cn('grid grid-cols-12 gap-6', className)}
      aria-labelledby={labelledBy}
      aria-label={label}
    >
      {items.map((item) => (
        <li key={item.href} className={cn(itemClassName, item.className)}>
          <IconLink href={item.href} title={item.title} icon={item.icon} size={size} />
        </li>
      ))}
    </ul>
  )
}

export function IconLinkImage({
  path,
  hasLightIcon,
  size = 'sm',
}: {
  path: string
  hasLightIcon?: boolean
  size?: IconLinkSize
}) {
  const imgClassName = sizeStyles[size].image

  return (
    <>
      {hasLightIcon ? (
        <img src={`${path}-light.svg`} alt="" className={cn(imgClassName, 'dark:hidden')} />
      ) : null}
      <img
        src={`${path}.svg`}
        alt=""
        className={cn(imgClassName, hasLightIcon && 'hidden dark:block')}
      />
    </>
  )
}

export function IconLinkMenuIcon({ icon }: { icon: string }) {
  return <MenuIconPicker icon={icon} width={18} height={18} />
}
