import 'katex/dist/katex.min.css'

import { ReferenceBetaNavigation } from '~/features/reference-beta/ReferenceBeta.navigation'
import {
  buildNavigationMenu,
  getDefinitions,
  resolveReferenceBetaPath,
} from '~/features/reference-beta/ReferenceBeta.utils'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

/**
 * The guides layout: definitions in the left sidebar, "on this page" and page
 * actions in the right rail. Lives under `[...slug]` so it knows which
 * library the page belongs to.
 */
export default async function ReferenceBetaSlugLayout(props: {
  children: React.ReactNode
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await props.params
  const resolved = await resolveReferenceBetaPath(slug)
  const library = resolved.type === 'index' ? resolved.library : resolved.definition.library
  const menu = buildNavigationMenu(library, await getDefinitions(library))

  return (
    <SidebarSkeleton
      hasRightRail
      NavigationMenu={<ReferenceBetaNavigation id={library.slug.join('/')} menu={menu} />}
    >
      <LayoutMainContent className="pb-0 layout-v2:lg:px-20">{props.children}</LayoutMainContent>
    </SidebarSkeleton>
  )
}
