import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import {
  genGuideMeta,
  genGuidesStaticParams,
  getGuidesMarkdown,
} from '~/features/docs/GuidesMdx.utils'
import { getEmptyArray } from '~/features/helpers.fn'
import { IS_DEV } from '~/lib/constants'
import { isFeatureEnabled } from 'common'
import { notFound } from 'next/navigation'

type Params = { slug?: string[] }

const WrappersDocs = async (props: { params: Promise<Params> }) => {
  if (!isFeatureEnabled('docs:fdw')) {
    notFound()
  }

  const params = await props.params
  const slug = ['database', 'extensions', 'wrappers', ...(params.slug ?? [])]
  const data = await getGuidesMarkdown(slug)

  return <GuideTemplate {...data!} />
}

const generateStaticParams = !IS_DEV
  ? genGuidesStaticParams('database/extensions/wrappers')
  : getEmptyArray
const generateMetadata = genGuideMeta((params: { slug?: string[] }) =>
  getGuidesMarkdown(['database', 'extensions', 'wrappers', ...(params.slug ?? [])])
)

export default WrappersDocs
export { generateMetadata, generateStaticParams }
