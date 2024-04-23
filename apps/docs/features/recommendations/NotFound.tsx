'use client'

import { type DocsSearchResult } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { useCommandMenu } from 'ui-patterns/Cmdk'
import ButtonCard from '~/components/ButtonCard'

const NotFound = ({
  recommendations,
  omitSearch = false,
}: {
  recommendations?: Omit<DocsSearchResult, 'sections'>[] | null
  omitSearch?: boolean
}) => {
  const { setIsOpen: setCommandMenuOpen } = useCommandMenu()

  return (
    <article className="prose max-w-[80ch]">
      <h1>We couldn&apos;t find that page</h1>
      <p>
        Sorry, we couldn&apos;t find that page. It might be missing, or we had a temporary error
        generating it.
      </p>
      <div className="flex flex-wrap gap-4">
        {!omitSearch && (
          <Button type="secondary" className="p-4" onClick={() => setCommandMenuOpen(true)}>
            Search for page
          </Button>
        )}
        <Button type="secondary" className="p-4" asChild>
          <Link href="/" className="no-underline">
            Return to homepage
          </Link>
        </Button>
        <Button type="secondary" className="p-4" asChild>
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
      {recommendations && (
        <section aria-labelledby="empty-page-recommendations" className="mt-20">
          <h2 id="empty-page-recommendations">Are you looking for...?</h2>
          <ul className="not-prose grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            {recommendations
              .filter(({ title }) => !!title)
              .slice(0, 6)
              .map(({ path, title, subtitle, description }) => (
                <ButtonCard
                  key={path}
                  to={path}
                  title={title}
                  description={subtitle || description || undefined}
                />
              ))}
          </ul>
        </section>
      )}
    </article>
  )
}

export { NotFound }
