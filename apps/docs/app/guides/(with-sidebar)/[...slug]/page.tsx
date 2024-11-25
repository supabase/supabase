import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

// Serve 404 when accessing pages that aren't prebuilt
export const dynamicParams = false

type Params = { slug: string[] }

const GuidePage = async ({ params }: { params: Params }) => {
  const data = await getGuidesMarkdown(params)
  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams()
const generateMetadata = genGuideMeta(getGuidesMarkdown)

export default GuidePage
export { generateStaticParams, generateMetadata }
