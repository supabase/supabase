import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const DeploymentGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['deployment', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('deployment')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['deployment', ...(params.slug ?? [])])
)

export default DeploymentGuidePage
export { generateStaticParams, generateMetadata }
