'use client'

import { useConfig } from '@/src/hooks/use-config'
import { resolveHideBranchesDropdown } from '@/src/utils/url-resolver'
import { usePathname } from 'next/navigation'
import { Button, cn } from 'ui'
import { BranchMenu } from './branch-menu'
import { LifeBuoy, MessageCircle } from 'lucide-react'

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
          ? 'bg-[#05A5FF]/5 border-b border-[#377995] items-start flex flex-col gap-3 h-[80px] delay-500'
          : 'h-[48px]',
        'transition-all ease-in-out duration-200'
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center -space-x-px">
          <BranchMenu />{' '}
        </div>
        <div className="flex gap-2">
          <Button type="default" icon={<MessageCircle />}>
            Feedback
          </Button>
          <Button type="default" icon={<LifeBuoy />}>
            Help
          </Button>
        </div>
      </div>
      {isPreview && (
        <p
          className={cn(
            'text-[#2DA9DE] text-xs',
            'opacity-0',
            isPreview && 'opacity-100',
            'transition-all ease-out'
          )}
        >
          This is a preview environment. Changes will not be saved.
        </p>
      )}
    </div>
  )
}
