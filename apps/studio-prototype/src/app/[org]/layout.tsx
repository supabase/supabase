'use client'

import RedirectCatcher from '@/src/components/redirect-catcher'
import EntranceTransition from './entrance-transition'
import ProjectContentTransition from './project-content-transition'
import SettingsMenuPanel from './settings-menu-panel'
import SideNav from './side-nav'
import { useParams } from 'next/navigation'
import { cn } from 'ui'

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { project } = useParams()

  return (
    <div className={cn('w-screen h-screen flex')} key={'org-layout'}>
      <div className={cn(project && 'hidden', 'h-full')}>
        <SideNav />
      </div>
      {/* <EntranceTransition>
        <SettingsMenuPanel />
        <div className="flex flex-col grow"> */}
      {/* <TopHeader /> */}
      {/* <ProjectContentTransition> */}
      <div className={cn(!project && 'py-12', 'w-full h-full flex')}>{children}</div>
      {/* </ProjectContentTransition> */}
      {/* </div> */}
      {/* </EntranceTransition> */}
      <RedirectCatcher />
    </div>
  )
}
