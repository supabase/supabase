'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

export default function SideNavMenuIcon({ product }: { product: any }) {
  const { org } = useParams()
  const pathname = usePathname()
  const isActive = pathname === `/${org}${product.href}`

  console.log('pathname', pathname)

  return (
    <Link
      key={product.name}
      href={`/${org}${product.href}`}
      className={cn(
        'relative',
        'w-full',
        'group/nav-item-anchor',
        'flex flex-col items-center'
        // isActive ? 'text-foreground' : 'text-foreground-50'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={cn(
          'absolute top-1/2 transform -translate-y-1/2 h-2 w-[3px] rounded-r-full duration-500',
          'group-hover/nav-item-anchor:bg-foreground-muted group-hover/nav-item-anchor:left-0',
          isActive ? '!bg-foreground left-0 w-[5px] duration-100' : '-left-1',

          'transition-all'
        )}
      ></div>
      {product.icon}
      {/* <span className="text-xs mt-1">{product.label}</span> */}
    </Link>
  )
}
