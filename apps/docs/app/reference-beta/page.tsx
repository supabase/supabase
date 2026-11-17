import {
  getLibrary,
  getLibrarySlugs,
  referenceBetaHref,
} from '~/features/reference-beta/ReferenceBeta.utils'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import Link from 'next/link'

export default async function ReferenceBetaPage() {
  const libraries = await Promise.all(
    (await getLibrarySlugs()).map(async (slug) => (await getLibrary(slug))!)
  )

  return (
    <SidebarSkeleton>
      <LayoutMainContent>
        <article className="prose max-w-none">
          <h1>Reference (beta)</h1>
          <p>Reference pages generated from definitions published by each library.</p>
          <ul>
            {libraries.map(({ slug, meta }) => (
              <li key={slug.join('/')}>
                <Link href={referenceBetaHref(slug)}>{meta.title}</Link>
                {meta.version && ` v${meta.version}`}
                {meta.description && ` — ${meta.description}`}
              </li>
            ))}
          </ul>
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
