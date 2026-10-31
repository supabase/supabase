import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'
import { IS_DEV } from '~/lib/constants'

type Params = { slug?: string[] }

const IntegrationsGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['integrations', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = !IS_DEV ? genGuidesStaticParams('integrations') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['integrations', ...(params.slug ?? [])])
)

export default IntegrationsGuidePage
export { generateStaticParams, generateMetadata }
