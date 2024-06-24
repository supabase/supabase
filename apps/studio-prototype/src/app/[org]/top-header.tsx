'use client'

import { useConfig } from '@/src/hooks/use-config'
import { resolveHideBranchesDropdown } from '@/src/utils/url-resolver'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'
import { BranchMenu } from './branch-menu'

export default function TopHeader() {
  const pathName = usePathname()
  const [config] = useConfig()
  const {
    organization,
    project,
    env: { name, type },
  } = config

  const isPreview = type !== 'prod' && !resolveHideBranchesDropdown(pathName, organization, project)

  return (
    <div
      className={cn(
        'border-b w-full px-3 bg-dash-sidebar py-2.5',
        isPreview
          ? 'bg-[#05A5FF]/5 border-b border-[#377995] items-start flex flex-col gap-3 h-[80px]'
          : 'h-[48px]',
        'transition-all ease-in-out duration-200'
      )}
    >
      <div className="flex items-center -space-x-px">
        <BranchMenu />{' '}
      </div>
      {isPreview && (
        <p className="text-[#2DA9DE] text-xs">
          This is a preview environment. Changes will not be saved.
        </p>
      )}
    </div>
  )
}
