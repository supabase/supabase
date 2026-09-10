'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/contribute/reddit', label: 'Reddit' },
  { href: '/contribute/discord', label: 'Discord' },
  { href: '/contribute/github', label: 'GitHub' },
]

export function PlatformTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-3 border-b pb-2">
      {tabs.map((tab) => {
        const isActive = pathname?.startsWith(tab.href) || false

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1 rounded-md text-sm ${
              isActive ? 'bg-slate-200 font-medium' : 'hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
