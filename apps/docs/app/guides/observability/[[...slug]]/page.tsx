import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import { IS_PROD } from 'common'
import { getEmptyArray } from '~/features/helpers.fn'

type Params = { slug?: string[] }

const ObservabilityGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['observability', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = IS_PROD ? genGuidesStaticParams('observability') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['observability', ...(params.slug ?? [])])
)

export default ObservabilityGuidePage
export { generateStaticParams, generateMetadata }
