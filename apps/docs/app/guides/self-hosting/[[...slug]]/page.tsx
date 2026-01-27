import { IS_PROD } from 'common'

import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'

type Params = { slug?: string[] }

const SelfHostingGuidePage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const slug = ['self-hosting', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = IS_PROD ? genGuidesStaticParams('self-hosting') : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['self-hosting', ...(params.slug ?? [])])
)

export default SelfHostingGuidePage
export { generateStaticParams, generateMetadata }
