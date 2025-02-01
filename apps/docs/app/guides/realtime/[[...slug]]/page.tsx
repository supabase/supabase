import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const RealtimeGuidePage = async ({ params }: { params: Params }) => {
  const slug = ['realtime', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('realtime')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['realtime', ...(params.slug ?? [])])
)

export default RealtimeGuidePage
export { generateStaticParams, generateMetadata }
