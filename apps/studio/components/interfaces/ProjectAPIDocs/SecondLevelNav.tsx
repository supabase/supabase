import { useParams } from 'common'
import { type ReactNode } from 'react'

import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useOpenAPISpecQuery } from 'data/open-api/api-spec-query'
import { useBucketInfoQueryPreferCached } from 'data/storage/buckets-query'
import { DOCS_URL } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { API_DOCS_CATEGORIES } from './ProjectAPIDocs.constants'
import { SecondLevelNavLayout, type MenuItemFilter } from './SecondLevelNav.Layout'
import { ResourcePickerList } from './SecondLevelNav.ResourcePicker'
import { StorageResourceList } from './SecondLevelNav.StoragePicker'

const OPEN_API_SPEC_STALE_TIME = 1000 * 60 * 10

const EntitiesSecondLevelNav = () => {
  const { ref } = useParams()

  const { data } = useOpenAPISpecQuery({ projectRef: ref }, { staleTime: OPEN_API_SPEC_STALE_TIME })
  const tables = data?.tables ?? []

  return (
    <SecondLevelNavLayout
      category={API_DOCS_CATEGORIES.ENTITIES}
      title="Tables & Views"
      docsUrl={`${DOCS_URL}/reference/javascript/select`}
      renderResourceList={(props) => (
        <ResourcePickerList {...props} items={tables} emptyMessage="No tables available" />
      )}
    />
  )
}

const StoredProceduresSecondLevelNav = () => {
  const { ref } = useParams()

  const { data } = useOpenAPISpecQuery({ projectRef: ref }, { staleTime: OPEN_API_SPEC_STALE_TIME })
  const functions = data?.functions ?? []

  return (
    <SecondLevelNavLayout
      category={API_DOCS_CATEGORIES.STORED_PROCEDURES}
      title="Stored Procedures"
      docsUrl={`${DOCS_URL}/reference/javascript/rpc`}
      renderResourceList={(props) => (
        <ResourcePickerList
          {...props}
          items={functions}
          emptyMessage="No stored procedures available"
        />
      )}
    />
  )
}

const EdgeFunctionsSecondLevelNav = () => {
  const { ref } = useParams()

  const { data: edgeFunctions } = useEdgeFunctionsQuery({ projectRef: ref })

  return (
    <SecondLevelNavLayout
      category={API_DOCS_CATEGORIES.EDGE_FUNCTIONS}
      title="Edge Functions"
      docsUrl={`${DOCS_URL}/reference/javascript/functions-invoke`}
      renderResourceList={(props) => (
        <ResourcePickerList
          {...props}
          items={edgeFunctions ?? []}
          emptyMessage="No edge functions available"
        />
      )}
    />
  )
}

const StorageSecondLevelNav = () => {
  const { ref } = useParams()

  const snap = useAppStateSnapshot()
  const [, resource] = snap.activeDocsSection

  const selectedBucket = useBucketInfoQueryPreferCached(resource, ref)

  const menuItemFilter: MenuItemFilter | undefined = selectedBucket
    ? (item) => {
        if (!selectedBucket.public && item.key === 'retrieve-public-url') return false
        if (selectedBucket.public && item.key === 'create-signed-url') return false
        return true
      }
    : undefined

  return (
    <SecondLevelNavLayout
      category={API_DOCS_CATEGORIES.STORAGE}
      title="Storage"
      docsUrl={`${DOCS_URL}/reference/javascript/storage-createbucket`}
      menuItemFilter={menuItemFilter}
      renderResourceList={(props) => <StorageResourceList {...props} projectRef={ref} />}
    />
  )
}

const SECTION_COMPONENTS: Record<string, () => ReactNode> = {
  [API_DOCS_CATEGORIES.ENTITIES]: EntitiesSecondLevelNav,
  [API_DOCS_CATEGORIES.STORED_PROCEDURES]: StoredProceduresSecondLevelNav,
  [API_DOCS_CATEGORIES.STORAGE]: StorageSecondLevelNav,
  [API_DOCS_CATEGORIES.EDGE_FUNCTIONS]: EdgeFunctionsSecondLevelNav,
}

export const SecondLevelNav = () => {
  const snap = useAppStateSnapshot()
  const [section] = snap.activeDocsSection

  const SectionComponent = SECTION_COMPONENTS[section]
  if (!SectionComponent) return null

  return <SectionComponent key={section} />
}
