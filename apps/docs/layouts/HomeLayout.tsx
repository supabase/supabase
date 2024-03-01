'use client'

import { MDXProvider } from '@mdx-js/react'
import { type PropsWithChildren } from 'react'

import components from '~/components'
import HomePageCover from '~/components/HomePageCover'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from './DefaultLayout'
import { MainSkeleton } from './MainSkeleton'

const HomeLayout = ({ children }: PropsWithChildren) => {
  return (
    <MainSkeleton menuId={MenuId.Home}>
      <article>
        <HomePageCover title="Supabase Documentation" />
        <LayoutMainContent>
          <div className={['relative transition-all ease-out', 'duration-150 '].join(' ')}>
            <div className="prose max-w-none">
              <MDXProvider components={components}>{children}</MDXProvider>
            </div>
          </div>
        </LayoutMainContent>
      </article>
    </MainSkeleton>
  )
}

export default HomeLayout
