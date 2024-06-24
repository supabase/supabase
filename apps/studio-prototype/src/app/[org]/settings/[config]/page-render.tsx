'use client'

import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

export default function PageRender() {
  const { org, config } = useParams()
  const pathname = usePathname()

  return (
    <div className="h-full p-3 py-5">
      <span className="text-lg text-foreground">
        {org} {config} {pathname}
      </span>
      <hr />
    </div>
  )
}
