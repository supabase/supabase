import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  IconAlertCircle,
  IconExternalLink,
  IconSearch,
  Input,
  Listbox,
  SidePanel,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ShimmeringLoader, { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'
import { DatabaseIndex, useIndexesQuery } from 'data/database/indexes-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import Table from 'components/to-be-cleaned/Table'
import CodeEditor from 'components/ui/CodeEditor'
import CreateIndexSidePanel from './CreateIndexSidePanel'

const Indexes = () => {
  const [search, setSearch] = useState('')
  const [selectedSchema, setSelectedSchema] = useState('public')
  const [selectedIndex, setSelectedIndex] = useState<DatabaseIndex>()
  const [showCreateIndex, setShowCreateIndex] = useState(false)

  const { project } = useProjectContext()
  const {
    data: allIndexes,
    error: indexesError,
    isLoading: isLoadingIndexes,
    isSuccess: isSuccessIndexes,
    isError: isErrorIndexes,
  } = useIndexesQuery({
    schema: selectedSchema,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: schemas,
    isLoading: isLoadingSchemas,
    isSuccess: isSuccessSchemas,
    isError: isErrorSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const sortedIndexes = (allIndexes?.result ?? []).sort(
    (a, b) => a.table.localeCompare(b.table) || a.name.localeCompare(b.name)
  )
  const indexes =
    search.length > 0
      ? sortedIndexes.filter((index) => index.name.includes(search) || index.table.includes(search))
      : sortedIndexes

  return (
    <>
      <div className="pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="mb-2 text-xl text-scale-1200">Indexes</h3>
            <div className="text-sm text-scale-900">
              Improve query performance against your database
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="https://supabase.com/docs/guides/database/query-optimization">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Documentation
                </Button>
              </a>
            </Link>
            <Link href="https://supabase.com/docs/guides/database/extensions/index_advisor">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Optimization with index_advisor
                </Button>
              </a>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {isLoadingSchemas && <ShimmeringLoader className="w-[260px]" />}
            {isErrorSchemas && (
              <div className="w-[260px] text-light text-sm border px-3 py-1.5 rounded flex items-center space-x-2">
                <IconAlertCircle strokeWidth={2} size={16} />
                <p>Failed to load schemas</p>
              </div>
            )}
            {isSuccessSchemas && (
              <Listbox
                size="small"
                value={selectedSchema}
                onChange={setSelectedSchema}
                className="w-[260px]"
              >
                {(schemas?.result ?? []).map((schema) => (
                  <Listbox.Option
                    key={schema.name}
                    value={schema.name}
                    label={schema.name}
                    addOnBefore={() => <span className="text-scale-900">schema</span>}
                  >
                    {schema.name}
                  </Listbox.Option>
                ))}
              </Listbox>
            )}
            <Input
              size="small"
              value={search}
              className="w-[250px]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for an index"
              icon={<IconSearch size={14} />}
            />
          </div>
          <Button
            type="primary"
            onClick={() => setShowCreateIndex(true)}
            disabled={!isSuccessSchemas}
          >
            Create index
          </Button>
        </div>

        {isLoadingIndexes && <GenericSkeletonLoader />}

        {isErrorIndexes && (
          <AlertError error={indexesError as any} subject="Failed to retrieve database indexes" />
        )}

        {isSuccessIndexes && (
          <Table
            head={[
              <Table.th key="schema">Schema</Table.th>,
              <Table.th key="table">Table</Table.th>,
              <Table.th key="name">Name</Table.th>,
              <Table.th key="buttons"></Table.th>,
            ]}
            body={
              <>
                {sortedIndexes.length === 0 && search.length === 0 && (
                  <Table.tr>
                    <Table.td colSpan={3}>
                      <p className="text-sm text-scale-1200">No indexes created yet</p>
                      <p className="text-sm text-light">
                        There are no indexes found in the schema "{selectedSchema}"
                      </p>
                    </Table.td>
                  </Table.tr>
                )}
                {sortedIndexes.length === 0 && search.length > 0 && (
                  <Table.tr>
                    <Table.td colSpan={3}>
                      <p className="text-sm text-scale-1200">No results found</p>
                      <p className="text-sm text-light">
                        Your search for "{search}" did not return any results
                      </p>
                    </Table.td>
                  </Table.tr>
                )}
                {indexes.length > 0 &&
                  indexes.map((index) => (
                    <Table.tr key={index.name}>
                      <Table.td>
                        <p title={index.schema}>{index.schema}</p>
                      </Table.td>
                      <Table.td>
                        <p title={index.table}>{index.table}</p>
                      </Table.td>
                      <Table.td>
                        <p title={index.name}>{index.name}</p>
                      </Table.td>
                      <Table.td>
                        <div className="flex justify-end items-center">
                          <Button type="default" onClick={() => setSelectedIndex(index)}>
                            View definition
                          </Button>
                        </div>
                      </Table.td>
                    </Table.tr>
                  ))}
              </>
            }
          />
        )}
      </div>

      <SidePanel
        visible={selectedIndex !== undefined}
        header={
          <>
            <span>Index:</span>
            <code className="text-sm ml-2">{selectedIndex?.name}</code>
          </>
        }
        onCancel={() => setSelectedIndex(undefined)}
      >
        <div className="h-full">
          <div className="relative h-full">
            <CodeEditor
              isReadOnly
              id={selectedIndex?.name ?? ''}
              language="pgsql"
              defaultValue={selectedIndex?.definition ?? ''}
            />
          </div>
        </div>
      </SidePanel>

      <CreateIndexSidePanel visible={showCreateIndex} onClose={() => setShowCreateIndex(false)} />
    </>
  )
}

export default observer(Indexes)
