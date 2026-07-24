import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import Link from 'next/link'
import { type ReactNode } from 'react'
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
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl p-3 no-underline transition-colors hover:bg-accent',
        className
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-100 transition-colors group-hover:border-strong',
          sizeStyles[size].tile
        )}
      >
        {icon}
      </div>
      <span className="text-base text-foreground">{title}</span>
    </Link>
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
