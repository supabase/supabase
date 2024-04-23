import { redirect } from 'next/navigation'
import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import { notFoundLink } from '~/features/recommendations/NotFound.utils'

type Params = { slug: string[] }

const GuidePage = async ({ params }: { params: Params }) => {
  let notFound = false
  let data: Awaited<ReturnType<typeof getGuidesMarkdown>>

  /**
   * This indirection is necessary because redirects operate by throwing, so
   * we cannot redirect within the catch block.
   */
  try {
    data = await getGuidesMarkdown(params)
  } catch {
    notFound = true
  }

  if (notFound) {
    redirect(notFoundLink(params.slug.join('/')))
  }

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams()
const generateMetadata = genGuideMeta(getGuidesMarkdown)

export default GuidePage
export { generateStaticParams, generateMetadata }
