import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'
import { IS_DEV } from '~/lib/constants'

type Params = { slug?: string[] }

const MonitoringTroubleshootingGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['telemetry', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = !IS_DEV ? genGuidesStaticParams('telemetry') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['telemetry', ...(params.slug ?? [])])
)

export default MonitoringTroubleshootingGuidePage
export { generateStaticParams, generateMetadata }
