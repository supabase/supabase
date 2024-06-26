import RedirectCatcher from '@/src/components/redirect-catcher'
import SettingsMenuPanel from './settings-menu-panel'
import TopHeader from './top-header'
import { motion } from 'framer-motion'
import EntranceTransition from './entrance-transition'

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="w-screen h-screen flex">
      <EntranceTransition>
        <SettingsMenuPanel />
        <div className="flex flex-col grow">
          <TopHeader />
          {children}
        </div>
      </EntranceTransition>
      <RedirectCatcher />
    </div>
  )
}
