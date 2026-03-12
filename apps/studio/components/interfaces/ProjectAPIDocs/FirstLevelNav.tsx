import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import SVG from 'react-inlinesvg'

import { useParams } from 'common'
import { InfiniteListDefault, type RowComponentBaseProps } from 'components/ui/InfiniteList'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useOpenAPISpecQuery } from 'data/open-api/api-spec-query'
import { usePaginatedBucketsQuery, type Bucket } from 'data/storage/buckets-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { Book, BookOpen } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { Button, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { navigateToSection } from './Content/Content.utils'
import { API_DOCS_CATEGORIES, DOCS_CONTENT, DOCS_MENU } from './ProjectAPIDocs.constants'

type DocsSections = typeof DOCS_MENU
type DocsSection = DocsSections[number]
type DocsSectionsSubset = readonly DocsSection[]
type DocsCategory = DocsSection['key']
type DocsContentRegistry = typeof DOCS_CONTENT
type DocsSnippet = DocsContentRegistry[keyof DocsContentRegistry]

const Separator = () => <hr className="border-t !mt-3 pb-1 mx-3" />

const MENU_BUTTON_CLASSES = cn(
  'w-full px-4',
  'text-left text-sm text-foreground-light',
  'transition hover:text-foreground'
)

/**
 * Gets the docs menu items based on feature flags.
 * @returns An array of menu items to be displayed in the docs navigation.
 */
const useDocsMenu = (): DocsSectionsSubset => {
  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
    'project_edge_function:all',
    'realtime:all',
  ])

  return DOCS_MENU.filter((item) => {
    if (item.key === 'user-management') return authEnabled
    if (item.key === 'storage') return storageEnabled
    if (item.key === 'edge-functions') return edgeFunctionsEnabled
    if (item.key === 'realtime') return realtimeEnabled
    return true
  })
}

/**
 * Gets the content snippets for a given documentation category.
 * @param category - The category of documentation to retrieve snippets for.
 * @returns An array of content snippets belonging to the specified category.
 */
const getSectionSnippets = (category: DocsCategory): DocsSnippet[] =>
  Object.values(DOCS_CONTENT).filter((snippet) => snippet.category === category)

export const FirstLevelNav = (): ReactNode => {
  const { ref } = useParams()

  const snap = useAppStateSnapshot()
  const currentSection = snap.activeDocsSection[0]

  const docsMenu = useDocsMenu()

  return (
    <>
      <nav aria-labelledby="api-docs-rest-categories" className="px-2 py-4  border-b">
        <h2 id="api-docs-rest-categories" className="sr-only">
          REST API Docs
        </h2>
        {docsMenu.map((item) => {
          const isActive = currentSection === item.key

          return (
            <Fragment key={item.key}>
              <button
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full px-3 py-2 rounded-md',
                  'text-left text-sm',
                  'transition',
                  isActive && 'bg-surface-300'
                )}
                onClick={() => snap.setActiveDocsSection([item.key])}
              >
                {item.name}
              </button>
              {isActive && <Subsections category={item.key} />}
            </Fragment>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-b">
        <Button
          block
          asChild
          type="text"
          size="small"
          icon={
            <SVG
              src={`${BASE_PATH}/img/graphql.svg`}
              style={{ width: `${16}px`, height: `${16}px` }}
              className="text-foreground"
              preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
            />
          }
          onClick={() => snap.setShowProjectApiDocs(false)}
        >
          <Link className="!justify-start" href={`/project/${ref}/integrations/graphiql`}>
            GraphiQL
          </Link>
        </Button>
        <Button block asChild type="text" size="small" icon={<BookOpen />}>
          <Link
            href={`${DOCS_URL}/guides/graphql`}
            target="_blank"
            rel="noreferrer"
            className="!justify-start"
          >
            GraphQL guide
          </Link>
        </Button>
      </div>

      <div className="px-2 py-4">
        <Button block asChild type="text" size="small" icon={<Book />}>
          <Link href={`${DOCS_URL}`} target="_blank" rel="noreferrer" className="!justify-start">
            Documentation
          </Link>
        </Button>
        <Button block asChild type="text" size="small" icon={<BookOpen />}>
          <Link
            href={`${DOCS_URL}/guides/api`}
            target="_blank"
            rel="noreferrer"
            className="!justify-start"
          >
            REST guide
          </Link>
        </Button>
      </div>
    </>
  )
}

type SubsectionsProps = {
  category: DocsCategory
}

const Subsections = ({ category }: SubsectionsProps): ReactNode => {
  const snippets = getSectionSnippets(category)

  return (
    <div className="space-y-2 py-2">
      {snippets.map((snippet) => (
        <button
          key={snippet.key}
          className={MENU_BUTTON_CLASSES}
          onClick={() => {
            navigateToSection(snippet.key)
          }}
        >
          {snippet.title}
        </button>
      ))}
      {category === API_DOCS_CATEGORIES.ENTITIES && <TablesSubsections />}
      {category === API_DOCS_CATEGORIES.STORED_PROCEDURES && <DbFunctionsSubsections />}
      {category === API_DOCS_CATEGORIES.STORAGE && <StorageSubsections />}
      {category === API_DOCS_CATEGORIES.EDGE_FUNCTIONS && <EdgeFunctionsSubsections />}
    </div>
  )
}

const TablesSubsections = (): ReactNode => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const { data, isLoading } = useOpenAPISpecQuery(
    { projectRef: ref },
    { staleTime: 1000 * 60 * 10 }
  )
  const tables = data?.tables ?? []

  // TODO: handle infinite loading of tables
  return (
    <>
      {isLoading && <LoadingIndicator />}
      {tables.length > 0 && <Separator />}
      {tables.map((table) => (
        <button
          key={table.name}
          className={MENU_BUTTON_CLASSES}
          onClick={() => snap.setActiveDocsSection([API_DOCS_CATEGORIES.ENTITIES, table.name])}
        >
          {table.name}
        </button>
      ))}
    </>
  )
}

const DbFunctionsSubsections = (): ReactNode => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const { data, isLoading } = useOpenAPISpecQuery(
    { projectRef: ref },
    { staleTime: 1000 * 60 * 10 }
  )
  const functions = data?.functions ?? []

  // TODO: handle virtualization of DB functions
  return (
    <>
      {isLoading && <LoadingIndicator />}
      {functions.length > 0 && <Separator />}
      {functions.map((fn) => (
        <button
          key={fn.name}
          className={MENU_BUTTON_CLASSES}
          onClick={() =>
            snap.setActiveDocsSection([API_DOCS_CATEGORIES.STORED_PROCEDURES, fn.name])
          }
        >
          {fn.name}
        </button>
      ))}
    </>
  )
}

const BucketButton = ({ item: bucket, style }: RowComponentBaseProps<Bucket>) => {
  const snap = useAppStateSnapshot()

  return (
    <button
      key={bucket.name}
      className={cn(MENU_BUTTON_CLASSES, 'py-1')}
      style={style}
      onClick={() => snap.setActiveDocsSection([API_DOCS_CATEGORIES.STORAGE, bucket.name])}
    >
      {bucket.name}
    </button>
  )
}

const StorageSubsections = (): ReactNode => {
  const { ref } = useParams()

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    usePaginatedBucketsQuery({
      projectRef: ref,
    })
  const buckets = data?.pages.flatMap((page) => page) ?? []

  return (
    <>
      {isLoading && <LoadingIndicator />}
      {buckets.length > 0 && <Separator />}
      <InfiniteListDefault
        className="max-h-80"
        items={buckets}
        getItemKey={(idx) => buckets[idx]?.name}
        getItemSize={() => 28}
        hasNextPage={!!hasNextPage}
        isLoadingNextPage={isFetchingNextPage}
        onLoadNextPage={fetchNextPage}
        ItemComponent={BucketButton}
        LoaderComponent={({ style }) => <LoadingIndicator style={{ ...style, width: '75%' }} />}
      />
    </>
  )
}

const EdgeFunctionsSubsections = (): ReactNode => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const { data: edgeFunctions, isLoading } = useEdgeFunctionsQuery({ projectRef: ref })

  // TODO: handle virtualization of edge functions
  return (
    <>
      {isLoading && <LoadingIndicator />}
      {(edgeFunctions ?? []).length > 0 && <Separator />}
      {(edgeFunctions ?? []).map((fn) => (
        <button
          key={fn.name}
          className={MENU_BUTTON_CLASSES}
          onClick={() => snap.setActiveDocsSection([API_DOCS_CATEGORIES.EDGE_FUNCTIONS, fn.name])}
        >
          {fn.name}
        </button>
      ))}
    </>
  )
}

type LoadingIndicatorProps = {
  className?: string
  style?: React.CSSProperties
}

const LoadingIndicator = ({ className, style }: LoadingIndicatorProps) => (
  <ShimmeringLoader style={style} className={cn('mx-2', className)} />
)
