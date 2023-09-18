import { useParams } from 'common'
import { observer } from 'mobx-react-lite'

import { EdgeFunctionsListItem, FunctionsEmptyState } from 'components/interfaces/Functions'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()
  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })

  const hasFunctions = (functions ?? []).length > 0

  return (
    <div className="py-6">
      {isLoading && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve edge functions" />}
      {isSuccess && (
        <>
          {hasFunctions ? (
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
                      functions.map((item) => (
                        <EdgeFunctionsListItem key={item.id} function={item} />
                      ))}
                  </>
                }
              />
            </div>
          ) : (
            <FunctionsEmptyState />
          )}
        </>
      )}
    </div>
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
