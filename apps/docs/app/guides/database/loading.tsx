import { GuideSkeleton } from '~/features/docs/GuidesMdx.skeleton'
import { getGuideShapes } from '~/features/docs/GuidesMdx.utils'

export default async function GuideLoading() {
  return <GuideSkeleton shapes={await getGuideShapes('database')} />
}
