'use client'

import { useConfig } from '@/src/hooks/use-config'
import { resolveHideBranchesDropdown, resolveHideProjectsDropdown } from '@/src/utils/url-resolver'
import { LifeBuoy, MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button, cn } from 'ui'
import { BranchMenu } from './branch-menu'
import UserMenu from './user-menu'
import SideMenuOrgMenu from './side-menu-org-menu'
import OrgMenu from './org-menu'
import Link from 'next/link'

export default function TopHeader() {
  const pathName = usePathname()
  const [config] = useConfig()
  const {
    selectedOrg,
    selectedProject,
    selectedEnv: { type },
    settingsAllPreviews,
  } = config

  const isHome = pathName.includes(`/${selectedOrg?.key}/projects`)
  // console.log(isHome)
  // console.log(pathName)

  const isPreview =
    (settingsAllPreviews && pathName.includes(`${selectedOrg?.key}/settings`)) ||
    (type !== 'prod' &&
      !resolveHideBranchesDropdown(pathName, selectedOrg?.key, selectedProject?.key))

  const pickersHidden =
    resolveHideBranchesDropdown(pathName, selectedOrg?.key, selectedProject?.key) &&
    resolveHideProjectsDropdown(pathName, selectedOrg?.key, selectedProject?.key)

  return (
    <div
      className={cn(
        'relative',
        'w-full px-5',
        'bg-dash-sidebar',
        isPreview
          ? 'bg-[#05A5FF]/5 items-start flex flex-col gap-3 h-[80px] delay-500'
          : 'h-[48px]',
        'transition-all ease-in-out duration-200'
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-3">
          <Link href={`/${selectedOrg?.key}/projects`}>
            <svg
              width="109"
              height="113"
              viewBox="0 0 109 113"
              fill="none"
              className="w-6 h-6 mr-2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                fill="url(#paint0_linear)"
              />
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                fill="url(#paint1_linear)"
                fillOpacity="0.2"
              />
              <path
                d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                fill="#3ECF8E"
              />
              <defs>
                <linearGradient
                  id="paint0_linear"
                  x1="53.9738"
                  y1="54.974"
                  x2="94.1635"
                  y2="71.8295"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#249361" />
                  <stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear"
                  x1="36.1558"
                  y1="30.578"
                  x2="54.4844"
                  y2="65.0806"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <OrgMenu />
          <div className="flex items-center -space-x-px">
            <BranchMenu />
          </div>
        </div>
        <div className="flex gap-3 h-[46px] items-center">
          <Button type="default" icon={<MessageCircle />}>
            Feedback
          </Button>
          <Button type="default" icon={<LifeBuoy />}>
            Help
          </Button>
          <UserMenu />
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
          // pickersHidden ? 'top-0 bg-transparent' : 'bottom-0 bg-border',
          'bottom-0 bg-border',
          'absolute left-0 h-px w-full',
          isPreview && 'bg-[#377995]',
          'transition-all ease-out duration-200'
        )}
      ></div>
    </div>
  )
}
