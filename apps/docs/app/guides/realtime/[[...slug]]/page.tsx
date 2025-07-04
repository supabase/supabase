import { IS_PROD } from 'common'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'

type Params = { slug?: string[] }

const RealtimeGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['realtime', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = IS_PROD ? genGuidesStaticParams('realtime') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['realtime', ...(params.slug ?? [])])
)

export default RealtimeGuidePage
export { generateMetadata, generateStaticParams }
