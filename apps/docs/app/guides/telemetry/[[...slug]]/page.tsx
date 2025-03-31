import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const MonitoringTroubleshootingGuidePage = async ({ params }: { params: Params }) => {
  const slug = ['telemetry', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('telemetry')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['telemetry', ...(params.slug ?? [])])
)

export default MonitoringTroubleshootingGuidePage
export { generateStaticParams, generateMetadata }
