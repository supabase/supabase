import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ContributingToc } from '~/app/contributing/ContributingToC'
import { MDXProviderGuides } from '~/features/docs/GuidesMdx.client'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export default async function ContributingPage() {
  const contentFile = join(dirname(fileURLToPath(import.meta.url)), 'content.mdx')
  const content = await readFile(contentFile, 'utf-8')

  return (
    <SidebarSkeleton>
      <LayoutMainContent className="pb-0 grid grid-cols-12 relative gap-4">
        <article className="prose max-w-none relative transition-all ease-out duration-100 col-span-12 lg:col-span-9">
          <MDXProviderGuides>
            <MDXRemoteBase source={content} />
          </MDXProviderGuides>
        </article>
        <ContributingToc />
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
