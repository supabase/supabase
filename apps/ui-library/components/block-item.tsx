'use client'

import { Command } from './command'
import type { ShadcnFramework } from '@/lib/install-command'

interface BlockItemProps {
  name: string
  framework?: ShadcnFramework
}

export const BlockItem = ({ name, framework = 'react' }: BlockItemProps) => {
  return (
    <div className="mt-4">
      <Command name={name} highlight framework={framework} />
    </div>
  )
}
