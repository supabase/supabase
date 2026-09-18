import HomePageCover from '~/components/HomePageCover'
import { setupCommands } from '~/components/HomePageCover.constants'
import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import { type PropsWithChildren } from 'react'

import { LayoutMainContent } from './DefaultLayout'
import { SidebarSkeleton } from './MainSkeleton'

const HomeLayout = ({ children }: PropsWithChildren) => {
  return (
    <SidebarSkeleton hideSideNav>
      <article>
        <HomePageCover
          title="Supabase Documentation"
          cliCode={
            <CodeBlock
              contents={setupCommands}
              lang="bash"
              lineNumbers={false}
              hideControls
              compact
              className="-mx-4 w-auto bg-transparent [&_.code-content]:px-4 [&_.code-content]:py-0"
            />
          }
        />
        <LayoutMainContent className="max-w-7xl">
          <div className={['relative transition-all ease-out', 'duration-150 '].join(' ')}>
            <div className="prose max-w-none">{children}</div>
          </div>
        </LayoutMainContent>
      </article>
    </SidebarSkeleton>
  )
}

export default HomeLayout
