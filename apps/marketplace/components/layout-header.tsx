'use client'

import { LogOut, Slash } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarTrigger,
} from 'ui'

import { TeamSwitcher } from '@/components/team-switcher'
import { createClient } from '@/lib/supabase/client'

type LayoutHeaderProps = {
  partners: {
    slug: string
    title: string
  }[]
  user: {
    email?: string
    fullName?: string
    avatarUrl?: string
  }
}

export function LayoutHeader({ partners, user }: LayoutHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const partnerSlug = segments[1]

  const homeHref = partnerSlug ? `/protected/${partnerSlug}` : '/protected'
  const initials = (user.fullName ?? user.email ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="flex h-12 shrink-0 items-center border-b">
      <div className="flex h-full items-center px-2 md:hidden">
        <SidebarTrigger className="text-foreground-lighter hover:text-foreground" />
      </div>
      <div className="flex h-full flex-1 items-center justify-between gap-6 px-3 md:px-4">
        <div className="flex items-center text-sm">
          <Link href={homeHref} className="hidden items-center md:flex">
            <svg
              aria-label="Supabase"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[18px] w-[18px]"
            >
              <path
                d="M12.7828 20.9736C12.2224 21.6713 11.0863 21.289 11.0728 20.3982L10.8754 7.36788H19.7364C21.3414 7.36788 22.2365 9.2008 21.2385 10.4437L12.7828 20.9736Z"
                fill="url(#paint0_linear_marketplace_header_logo)"
              />
              <path
                d="M12.7828 20.9736C12.2224 21.6713 11.0863 21.289 11.0728 20.3982L10.8754 7.36788H19.7364C21.3414 7.36788 22.2365 9.2008 21.2385 10.4437L12.7828 20.9736Z"
                fill="url(#paint1_linear_marketplace_header_logo)"
                fillOpacity="0.2"
              />
              <path
                d="M9.17895 0.00677839C9.7393 -0.69101 10.8754 -0.308673 10.8889 0.582223L10.9755 13.6125H2.22528C0.620264 13.6125 -0.274897 11.7795 0.72316 10.5367L9.17895 0.00677839Z"
                fill="#3ECF8E"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_marketplace_header_logo"
                  x1="10.8754"
                  y1="10.257"
                  x2="18.7239"
                  y2="13.5861"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#249361" />
                  <stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_marketplace_header_logo"
                  x1="7.38382"
                  y1="5.53017"
                  x2="10.9125"
                  y2="12.2482"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <div className="flex items-center md:pl-2">
            <Slash className="mx-2 hidden size-4 text-border-stronger md:block" />
            <TeamSwitcher partners={partners} activePartnerSlug={partnerSlug} />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="outline"
              size="small"
              className="rounded-full w-7 h-7 p-0 items-center justify-center"
            >
              <Avatar className="w-7 h-7 rounded-full">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.email ?? 'User'} />
                ) : null}
                <AvatarFallback className="text-xs heading-meta">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuItem onClick={onLogout} className="gap-2">
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
