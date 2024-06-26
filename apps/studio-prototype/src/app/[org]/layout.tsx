import RedirectCatcher from '@/src/components/redirect-catcher'
import SettingsMenuPanel from './settings-menu-panel'
import SideNav from './side-nav'
import TopHeader from './top-header'

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="w-screen h-screen flex">
      <SideNav />
      <SettingsMenuPanel />
      <div className="flex flex-col grow">
        <TopHeader />
        {children}
      </div>
      <RedirectCatcher />
    </div>
  )
}
