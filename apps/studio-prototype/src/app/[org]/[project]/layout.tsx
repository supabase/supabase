import RedirectCatcher from '@/src/components/redirect-catcher'
import EntranceTransition from '../entrance-transition'
import ProjectContentTransition from '../project-content-transition'
import SettingsMenuPanel from '../settings-menu-panel'
import SideNav from './side-nav'

export default function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="w-full h-full flex">
      <SideNav />
      <EntranceTransition>
        <SettingsMenuPanel />
        <div className="flex flex-col grow">
          {/* <TopHeader /> */}
          <ProjectContentTransition>{children}</ProjectContentTransition>
        </div>
      </EntranceTransition>
      {/* <RedirectCatcher /> */}
    </div>
  )
}
