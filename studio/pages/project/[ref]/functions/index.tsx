import { observer } from 'mobx-react-lite'
import { useParams } from 'hooks'
import { NextPageWithLayout } from 'types'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import { FunctionsEmptyState } from 'components/interfaces/Functions'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import EdgeFunctionsRow from 'components/interfaces/Functions/EdgeFunctionsRow'

const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { isLoading, data: functions } = useEdgeFunctionsQuery({ projectRef: ref })

  const hasFunctions = (functions ?? []).length > 0

  if (isLoading || functions === undefined) {
    return (
      <div className="space-y-2 w-full py-6">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  return hasFunctions ? (
    <div className="py-6">
      {(functions ?? []).map((fn) => (
        <EdgeFunctionsRow key={fn.id} fn={fn} />
      ))}
    </div>
  ) : (
    <FunctionsEmptyState />
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
