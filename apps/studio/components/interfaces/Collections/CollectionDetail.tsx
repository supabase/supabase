import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { useCollectionQuery } from 'data/collections/collections-query'
import { useRouter } from 'next/router'
import React from 'react'

type Props = {}

const CollectionDetail = (props: Props) => {
  const router = useRouter()
  const collectionId = router.query.collectionId as string
  const projectRef = router.query.ref as string

  const collection = useCollectionQuery({
    projectRef,
    collectionId,
  })

  return (
    <LogsPreviewer
      projectRef={projectRef}
      condensedLayout={true}
      // @ts-ignore
      tableName={'edge_logs'}
      queryType={'api'}
    />
  )
}

export default CollectionDetail
