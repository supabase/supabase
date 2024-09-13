'use client'

import Link from 'next/link'
import { useHoverControls } from '../side-nav-hover-context'
import { useConfig } from '@/src/hooks/use-config'

export default function SideNavExtra() {
  const { controls, isHovered } = useHoverControls()

  const [config] = useConfig()

  return (
    <div>
      <Link
        href={`/${config?.selectedOrg?.key}/projects`}
      >{`back to ${config?.selectedOrg?.name}`}</Link>
    </div>
  )
}
