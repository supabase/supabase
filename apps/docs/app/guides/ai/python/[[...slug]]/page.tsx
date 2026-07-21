import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'
import { IS_DEV } from '~/lib/constants'

type Params = { slug?: string[] }

const PythonClientDocs = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['ai', 'python', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = !IS_DEV ? genGuidesStaticParams('ai/python') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['ai', 'python', ...(params.slug ?? [])])
)

export default PythonClientDocs
export { generateStaticParams, generateMetadata }
