'use client'

import { useState } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import { PageNav } from 'ui-patterns/PageNav'

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'logs', label: 'Logs' },
  { id: 'settings', label: 'Settings' },
] as const

export default function PageNavDemo() {
  const [activePage, setActivePage] = useState<(typeof pages)[number]['id']>('overview')

  return (
    <div className="w-full">
      <PageNav>
        <NavMenu>
          {pages.map((page) => (
            <NavMenuItem key={page.id} active={activePage === page.id}>
              <button
                type="button"
                aria-pressed={activePage === page.id}
                className="h-full cursor-pointer appearance-none bg-transparent text-inherit"
                onClick={() => setActivePage(page.id)}
              >
                {page.label}
              </button>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>
    </div>
  )
}
