'use client'

import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from 'ui'

import { cn } from '@/lib/utils'

export function TeamSwitcher({
  partners,
  activePartnerSlug,
}: {
  partners: {
    slug: string
    title: string
  }[]
  activePartnerSlug?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const activePartner =
    partners.find((partner) => partner.slug === activePartnerSlug) ?? partners[0]

  if (!activePartner) {
    return null
  }

  const buildPartnerHref = (targetSlug: string) => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] !== 'protected') {
      return `/protected/${targetSlug}`
    }

    const [, currentSlug, ...rest] = segments
    if (!currentSlug) return `/protected/${targetSlug}`
    return `/protected/${targetSlug}${rest.length > 0 ? `/${rest.join('/')}` : ''}`
  }

  return (
    <div className="flex items-center">
      <Link
        href={`/protected/${activePartner.slug}`}
        className="flex items-center gap-2 text-sm text-foreground"
      >
        <Building2 size={14} className="text-foreground-lighter" />
        <span className={cn('max-w-44 truncate hidden md:block')}>{activePartner.title}</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" size="small" className="ml-3 px-1.5">
            <ChevronsUpDown size={14} className="text-foreground-lighter" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Partners</DropdownMenuLabel>
          {partners.map((partner, index) => (
            <DropdownMenuItem
              key={partner.slug}
              className="gap-2 p-2"
              onClick={() => router.push(buildPartnerHref(partner.slug))}
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <Building2 className="size-3.5 shrink-0" />
              </div>
              <span className="flex-1 truncate">{partner.title}</span>
              {activePartner.slug === partner.slug ? (
                <Check className="size-4 text-foreground-lighter" />
              ) : (
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="gap-2 p-2">
            <Link href="/partners/new">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add partner</div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
