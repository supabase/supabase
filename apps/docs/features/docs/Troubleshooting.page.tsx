import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { MDXRemoteBase } from './MdxBase'
import {
  TroubleshootingBackLink,
  TroubleshootingErrorListDetailed,
} from './Troubleshooting.ui.client'
import { type ITroubleshootingEntry } from './Troubleshooting.utils'

export default function TroubleshootingPage({ entry }: { entry: ITroubleshootingEntry }) {
  return (
    <SidebarSkeleton>
      <LayoutMainContent className="@container/troubleshooting-entry-layout w-full max-w-none">
        <div className="w-full max-w-screen-lg mx-auto grid @5xl/troubleshooting-entry-layout:grid-cols-[1fr,8fr,1fr] gap-x-12">
          <TroubleshootingBackLink className="hidden @5xl/troubleshooting-entry-layout:block whitespace-nowrap self-start justify-self-end" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <h1 className="w-fit text-foreground-light text-sm border rounded-lg px-2 py-0.5 mb-2">
                Troubleshooting topic
              </h1>
              <TroubleshootingBackLink className="@5xl/troubleshooting-entry-layout:hidden" />
            </div>
            <article className="prose max-w-none">
              <h1>{entry.data.title}</h1>
              {entry.data.errors?.length > 0 && (
                <>
                  <TroubleshootingErrorListDetailed errors={entry.data.errors} />
                  <hr aria-hidden className="mt-4 mb-8" />
                </>
              )}
              <MDXRemoteBase source={entry.content} />
            </article>
          </div>
          <div></div>
        </div>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
