import Breadcrumbs from '~/components/Breadcrumbs'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { MDXRemoteBase } from './MdxBase'
import { TroubleshootingErrorListDetailed } from './Troubleshooting.ui.client'
import { type ITroubleshootingEntry } from './Troubleshooting.utils'

export default function TroubleshootingPage({ entry }: { entry: ITroubleshootingEntry }) {
  return (
    <SidebarSkeleton>
      <LayoutMainContent className="@container/troubleshooting-entry-layout w-full max-w-[80ch]">
        <Breadcrumbs minLength={1} forceDisplayOnMobile />
        <article className="prose max-w-none mt-4">
          <h1>{entry.data.title}</h1>
          {entry.data.errors?.length > 0 && (
            <>
              <TroubleshootingErrorListDetailed errors={entry.data.errors} />
              <hr aria-hidden className="mt-4 mb-8" />
            </>
          )}
          <MDXRemoteBase source={entry.content} />
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
