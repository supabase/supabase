import Link from 'next/link'

import { allDocs } from '@/.velite'
import { frameworkTitles } from '@/config/docs'

/**
 * Static list of links to the other framework versions of a block. Rendered on the server so
 * every version of a block is reachable from the page HTML, not only from the framework menu.
 */
export function OtherFrameworks({ slug }: { slug: string }) {
  const [currentFramework, ...docPath] = slug.split('/')
  const docName = docPath.join('/')

  // Other versions are the docs with the same path under a different framework folder
  const otherFrameworks = Object.keys(frameworkTitles).filter(
    (framework) =>
      framework !== currentFramework &&
      allDocs.some((doc) => doc.slugAsParams === `${framework}/${docName}`)
  )

  if (!(currentFramework in frameworkTitles) || otherFrameworks.length === 0) {
    return null
  }

  return (
    <nav aria-labelledby="other-frameworks-heading" className="border-t py-8">
      <h2 id="other-frameworks-heading" className="text-xs text-foreground-lighter">
        Other frameworks
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {otherFrameworks.map((framework) => (
          <li key={framework}>
            <Link
              href={`/docs/${framework}/${docName}`}
              className="inline-flex h-7 items-center rounded-md border bg-surface-75 px-2 text-xs text-foreground-light transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {frameworkTitles[framework]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
