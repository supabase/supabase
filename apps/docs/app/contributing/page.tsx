import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ContributingToc } from '~/app/contributing/ContributingToC'
import { MDXProviderGuides } from '~/features/docs/GuidesMdx.client'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export default async function ContributingPage() {
  const contentFile = join(dirname(fileURLToPath(import.meta.url)), 'content.mdx')
  const content = await readFile(contentFile, 'utf-8')

  return (
    <SidebarSkeleton hideSideNav>
      <div className="px-8 py-16">
        <article className="prose mx-auto">
          <MDXProviderGuides>
            <MDXRemoteBase source={content} />
          </MDXProviderGuides>
        </article>
        <ContributingToc />
      </div>
    </SidebarSkeleton>
  )
}
