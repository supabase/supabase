import { observer } from 'mobx-react-lite'

import { useParams } from 'common/hooks'
import { NextPageWithLayout } from 'types'
import Table from 'components/to-be-cleaned/Table'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import { EdgeFunctionsListItem, FunctionsEmptyState } from 'components/interfaces/Functions'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'

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
    <div className="py-6 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-scale-900">{`${functions.length} function${
          functions.length > 1 ? 's' : ''
        } deployed`}</span>
      </div>
      <Table
        head={
          <>
            <Table.th>Name</Table.th>
            <Table.th>URL</Table.th>
            <Table.th className="hidden 2xl:table-cell">Created</Table.th>
            <Table.th className="lg:table-cell">Last updated</Table.th>
            <Table.th className="lg:table-cell">Deployments</Table.th>
          </>
        }
        body={
          <>
            {functions.length > 0 &&
              functions.map((item) => <EdgeFunctionsListItem key={item.id} function={item} />)}
          </>
        }
      />
    </div>
  ) : (
    <FunctionsEmptyState />
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
