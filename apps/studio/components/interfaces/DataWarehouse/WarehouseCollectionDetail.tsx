import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useCollectionQuery } from 'data/collections/collections-query'
import { useRouter } from 'next/router'
import React from 'react'
import { Button, IconRewind } from 'ui'
import { LogTable } from '../Settings/Logs'

type Props = {}

export const WarehouseCollectionDetail = (props: Props) => {
  const router = useRouter()
  const collectionId = router.query.collectionId as string
  const projectRef = router.query.ref as string

  const [params, setParams] = React.useState({
    project: 'string', // project ref
    sql: '',
  })

  const {
    isLoading,
    data: collection,
    isError,
  } = useCollectionQuery({
    projectRef,
    collectionId,
  })

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
            data={collection?.data}
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
