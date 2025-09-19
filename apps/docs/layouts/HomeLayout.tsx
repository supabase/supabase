import { type PropsWithChildren } from 'react'

import HomePageCover from '~/components/HomePageCover'
import { LayoutMainContent } from './DefaultLayout'
import { SidebarSkeleton } from './MainSkeleton'
import { isFeatureEnabled } from 'common'

const HomeLayout = ({ children }: PropsWithChildren) => {
  return (
    <SidebarSkeleton hideSideNav>
      <article>
        {isFeatureEnabled('docs:full_getting_started') === true && (
          <HomePageCover title="Supabase Documentation" />
        )}
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
