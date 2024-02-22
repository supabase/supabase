import { useQuery } from '@tanstack/react-query'
import { collectionKeys } from './keys'

type CollectionsQueryArgs = {
  projectRef: string
}
export function useCollectionsQuery({ projectRef }: CollectionsQueryArgs) {
  const _keys = [...collectionKeys.list(projectRef)]
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  const collectionsQuery = useQuery(_keys, async () => {
    // mock collections
    const collections = [
      {
        id: '1',
        name: 'Collection 1',
        description: 'Collection 1 description',
      },
      {
        id: '2',
        name: 'Collection 2',
        description: 'Collection 2 description',
      },
      {
        id: '3',
        name: 'Collection 3',
        description: 'Collection 3 description',
      },
    ]

    // mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return collections
  })

  return collectionsQuery
}

type CollectionQueryArgs = {
  projectRef: string
  collectionId: string
}
export function useCollectionQuery({ projectRef, collectionId }: CollectionQueryArgs) {
  const collectionQuery = useQuery(collectionKeys.item(projectRef, collectionId), async () => {
    // mock collection
    const collection = {
      id: collectionId,
      name: `Collection ${collectionId}`,
      description: `Collection ${collectionId} description`,
    }

    // mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return collection
  })

  return collectionQuery
}
