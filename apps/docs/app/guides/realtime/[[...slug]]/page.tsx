import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'

type Params = { slug?: string[] }

const RealtimeGuidePage = async ({ params }: { params: Params }) => {
  const slug = ['realtime', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams =
  // [Charis 2025-04-21] For some reason, using the IS_PROD export from common
  // does not work (its type is a function when this is evaluated?)
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? genGuidesStaticParams('realtime')
    : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['realtime', ...(params.slug ?? [])])
)

export default RealtimeGuidePage
export { generateMetadata, generateStaticParams }
