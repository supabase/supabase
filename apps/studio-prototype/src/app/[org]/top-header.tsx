'use client'

import { useConfig } from '@/src/hooks/use-config'
import { resolveHideBranchesDropdown, resolveHideProjectsDropdown } from '@/src/utils/url-resolver'
import { usePathname } from 'next/navigation'
import { Button, cn } from 'ui'
import { BranchMenu } from './branch-menu'
import { LifeBuoy, MessageCircle } from 'lucide-react'

export default function TopHeader() {
  const pathName = usePathname()
  const [config] = useConfig()
  const {
    selectedOrg,
    selectedProject,
    selectedEnv: { type },
  } = config

  const isPreview =
    type !== 'prod' &&
    !resolveHideBranchesDropdown(pathName, selectedOrg?.key, selectedProject?.key)

  const pickersHidden =
    resolveHideBranchesDropdown(pathName, selectedOrg?.key, selectedProject?.key) &&
    resolveHideProjectsDropdown(pathName, selectedOrg?.key, selectedProject?.key)

  return (
    <div
      className={cn(
        'relative',
        'w-full px-3 bg-dash-sidebar py-2.5',
        isPreview
          ? 'bg-[#05A5FF]/5 items-start flex flex-col gap-3 h-[80px] delay-500'
          : 'h-[48px]',
        'transition-all ease-in-out duration-200'
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center -space-x-px">
          <BranchMenu />
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
      {/* {isPreview && (, */}
      <p
        className={cn(
          'text-xs',
          'text-transparent',
          isPreview ? 'delay-500 opacity-100 text-[#2DA9DE]' : 'opacity-0',
          'transition-all ease-out'
        )}
      >
        This is a preview environment. Changes will not be saved.
      </p>
      {/* )} */}
      {/* // border bottom */}
      <div
        className={cn(
          pickersHidden ? 'top-0 bg-transparent' : 'bottom-0 bg-border',
          'absolute left-0 h-px w-full',
          isPreview && 'bg-[#377995]',
          'transition-all ease-out duration-200'
        )}
      ></div>
    </div>
  )
}
