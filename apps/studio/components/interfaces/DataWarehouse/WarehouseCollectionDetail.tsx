import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useCollectionQuery } from 'data/collections/collections-query'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { Button, IconRewind } from 'ui'
import { LogTable } from '../Settings/Logs'
import { useWarehouseQueryQuery } from 'data/analytics/warehouse-query'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'

type Props = {}

export const WarehouseCollectionDetail = (props: Props) => {
  const router = useRouter()
  const collectionToken = router.query.collectionToken as string
  const projectRef = router.query.ref as string
  const { data: collections } = useWarehouseCollectionsQuery({ projectRef }, { enabled: true })
  const collection = (collections || []).find((c) => c.token === collectionToken)
  const [params, setParams] = React.useState({
    project: 'string', // project ref
    sql: `select current_timestamp() as 'time'`,
  })
  console.log(params.sql)

  useEffect(() => {
    if (collection) {
      setParams({
        ...params,
        sql: `
      select timestamp, id, event_message from \`${collection.name}\`
      `,
      })
    }
  }, [collection])

  const { isLoading, data, isError } = useWarehouseQueryQuery(
    { projectRef, sql: params.sql },
    { enabled: !!params.sql }
  )
  console.log('data', data)
  const results = data?.results || []
  const isLoadingOlder = false
  function loadOlder() {
    console.log('loadOlder')
  }

  return (
    <>
      {/* <pre>{JSON.stringify(collection, null, 2)}</pre> */}
      <div className="relative flex flex-col flex-grow h-full">
        <ShimmerLine active={isLoading} />
        <LoadingOpacity active={isLoading}>
          <LogTable
            projectRef={projectRef}
            isLoading={isLoading}
            hideHeader={true}
            data={results}
            params={params}
            error={isError ? 'Error loading data' : undefined}
            maxHeight="calc(100vh - 3rem - 44px)"
          />
        </LoadingOpacity>
        {!isError && (
          <div className="border-t flex flex-row justify-between p-2">
            <Button
              onClick={loadOlder}
              icon={<IconRewind />}
              type="default"
              loading={isLoadingOlder}
              disabled={isLoadingOlder}
            >
              Load older
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
