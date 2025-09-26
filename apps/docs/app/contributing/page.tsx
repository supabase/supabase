import { notFound } from 'next/navigation'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isFeatureEnabled } from 'common'
import { ContributingToc } from '~/app/contributing/ContributingToC'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import Breadcrumbs from '~/components/Breadcrumbs'

export default async function ContributingPage() {
  if (!isFeatureEnabled('docs:contribution')) {
    notFound()
  }

  const contentFile = join(dirname(fileURLToPath(import.meta.url)), 'content.mdx')
  const content = await readFile(contentFile, 'utf-8')

  return (
    <SidebarSkeleton>
      <LayoutMainContent className="pb-0 grid grid-cols-12 relative gap-4">
        <div className="col-span-12 lg:col-span-9">
          <Breadcrumbs className="mb-2 col-span-full" />
          <article
            id="contributing"
            className="prose max-w-none relative transition-all ease-out duration-100"
          >
            <MDXRemoteBase source={content} />
          </article>
        </div>
        <ContributingToc />
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
