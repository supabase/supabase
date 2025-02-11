import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const GettingStartedGuidePage = async ({ params }: { params: Params }) => {
  const slug = ['getting-started', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('getting-started')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['getting-started', ...(params.slug ?? [])])
)

export default GettingStartedGuidePage
export { generateStaticParams, generateMetadata }
