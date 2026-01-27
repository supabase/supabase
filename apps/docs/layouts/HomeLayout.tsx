import { type PropsWithChildren } from 'react'

import { LayoutMainContent } from './DefaultLayout'
import { SidebarSkeleton } from './MainSkeleton'
import HomePageCover from '~/components/HomePageCover'

const HomeLayout = ({ children }: PropsWithChildren) => {
  return (
    <SidebarSkeleton hideSideNav>
      <article>
        <HomePageCover title="Supabase Documentation" />
        <LayoutMainContent>
          <div className={['relative transition-all ease-out', 'duration-150 '].join(' ')}>
            <div className="prose max-w-none">{children}</div>
          </div>
        </LayoutMainContent>
      </article>
    </SidebarSkeleton>
  )
}

export default HomeLayout
