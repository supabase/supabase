import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import { IS_PROD } from 'common'
import { getEmptyArray } from '~/features/helpers.fn'

type Params = { slug?: string[] }

const ResourcesGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['resources', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = IS_PROD ? genGuidesStaticParams('resources') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['resources', ...(params.slug ?? [])])
)

export default ResourcesGuidePage
export { generateStaticParams, generateMetadata }
