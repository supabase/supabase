import { ClientLibHeader } from '~/features/docs/Reference.header'

import { ReferenceBetaMdx } from './ReferenceBeta.markdown'
import { ReferenceBetaPageTemplate } from './ReferenceBeta.pageTemplate'
import { type Library } from './ReferenceBeta.utils'

/**
 * A library's landing page: the same header as the SDK reference pages, the
 * `index.md` introduction, then every definition listed under its category.
 */
export async function ReferenceBetaIndexLayout({ library }: { library: Library }) {
  const { meta, content } = library

  return (
    <ReferenceBetaPageTemplate
      title={meta.title}
      header={
        <div className="not-prose">
          <ClientLibHeader
            menuData={{
              title: meta.title,
              ...(meta.icon ? { icon: meta.icon } : {}),
              ...(meta.package ? { pkg: { name: meta.package, repo: meta.repo } } : {}),
            }}
            heading={meta.title}
            className="mt-4 mb-8"
          />
        </div>
      }
    >
      <ReferenceBetaMdx>{content}</ReferenceBetaMdx>
    </ReferenceBetaPageTemplate>
  )
}
