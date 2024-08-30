import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from 'ui'

import { SearchButton, Recommendations } from '~/features/recommendations/NotFound.client'

const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const NotFoundPage = async ({ searchParams: { page } }: { searchParams: { page?: string } }) => {
  return (
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
      <Recommendations page={page} />
    </article>
  )
}

export default NotFoundPage
export { metadata }
