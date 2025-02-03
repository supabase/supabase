import {
  getGuidesMarkdown,
  genGuideMeta,
  genGuidesStaticParams,
} from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'

export const dynamicParams = false

type Params = { slug?: string[] }

const MonitoringTroubleshootingGuidePage = async ({ params }: { params: Params }) => {
  const slug = ['monitoring-troubleshooting', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = genGuidesStaticParams('monitoring-troubleshooting')
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['monitoring-troubleshooting', ...(params.slug ?? [])])
)

export default MonitoringTroubleshootingGuidePage
export { generateStaticParams, generateMetadata }
