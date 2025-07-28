import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const IntegrationsGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['integrations', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('integrations')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['integrations', ...(params.slug ?? [])])
)

export default IntegrationsGuidePage
export { generateStaticParams, generateMetadata }
