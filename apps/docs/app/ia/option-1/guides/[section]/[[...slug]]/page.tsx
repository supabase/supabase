import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import { genGuideMeta, getGuidesMarkdown } from '~/features/docs/GuidesMdx.utils'

type Params = { section: string; slug?: string[] }

const Option1GuidePage = async (props: { params: Promise<Params> }) => {
  const { section, slug } = await props.params
  const data = await getGuidesMarkdown([section, ...(slug ?? [])])

  return <GuideTemplate {...data!} />
}

const generateStaticParams = async () => []
const generateMetadata = genGuideMeta(({ section, slug }: Params) =>
  getGuidesMarkdown([section, ...(slug ?? [])])
)

export default Option1GuidePage
export { generateStaticParams, generateMetadata }
