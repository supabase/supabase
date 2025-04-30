import { IS_PROD } from 'common'
import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'

type Params = { slug?: string[] }

const StorageGuidePage = async ({ params }: { params: Params }) => {
  const slug = ['storage', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = IS_PROD ? genGuidesStaticParams('storage') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['storage', ...(params.slug ?? [])])
)

export default StorageGuidePage
export { generateMetadata, generateStaticParams }
