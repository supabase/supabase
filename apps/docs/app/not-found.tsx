import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from 'ui'

import { Recommendations, SearchButton } from '~/features/recommendations/NotFound.client'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export default function NotFound() {
  return (
    <SidebarSkeleton>
      <LayoutMainContent>
        <article className="prose max-w-[80ch]">
          <h1>404: We couldn&apos;t find that page</h1>
          <p>
            Sorry, we couldn&apos;t find that page. It might be missing, or we had a temporary error
            generating it.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <SearchButton />
            <Button type="default" size="small" className="p-4" asChild>
              <Link href="/" className="no-underline">
                Return to homepage
              </Link>
            </Button>
            <Button type="text" size="small" asChild>
              <Link
                href="https://github.com/supabase/supabase/issues/new?assignees=&labels=documentation&projects=&template=2.Improve_docs.md"
                target="_blank"
                rel="noreferrer noopener"
                className="no-underline"
              >
                Report missing page
              </Link>
            </Button>
          </div>
          <Recommendations />
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}

export const metadata: Metadata = {
  title: 'Not found',
  robots: {
    index: false,
  },
}
