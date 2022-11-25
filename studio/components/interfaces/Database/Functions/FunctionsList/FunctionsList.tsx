import { FC } from 'react'
import { uniqBy, map as lodashMap, includes } from 'lodash'
import { Button, IconSearch, IconLoader, Input } from 'ui'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import SchemaTable from './SchemaTable'

const FunctionsList: FC<any> = ({
  filterString,
  setFilterString = () => {},
  createFunction = () => {},
  editFunction = () => {},
  deleteFunction = () => {},
}) => {
  const { meta } = useStore()
  const functions = meta.functions.list((fn: any) => !meta.excludedSchemas.includes(fn.schema))
  const filteredFunctions = functions.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredFunctionSchemas = lodashMap(uniqBy(filteredFunctions, 'schema'), 'schema')
  const canCreateFunctions = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'functions')

  if (meta.functions.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size={14} />
        <p>Loading functions...</p>
      </div>
    )
  }

  if (meta.functions.hasError) {
    return (
      <p className="px-6 py-4">
        <p>Error connecting to API</p>
        <p>{`${meta.functions.error?.message ?? 'Unknown error'}`}</p>
      </p>
    )
  }

  return (
    <>
      {functions.length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Functions"
            ctaButtonLabel="Create a new function"
            onClickCta={() => createFunction()}
          >
            <AlphaPreview />
            <p className="text-sm text-scale-1100">
              PostgreSQL functions, also known as stored procedures, is a set of SQL and procedural
              commands such as declarations, assignments, loops, flow-of-control, etc.
            </p>
            <p className="text-sm text-scale-1100">
              It's stored on the database server and can be invoked using the SQL interface.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4 py-4">
          <div className="flex items-center justify-between px-6">
            <Input
              placeholder="Filter by name"
              size="small"
              icon={<IconSearch size="tiny" />}
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button disabled={!canCreateFunctions} onClick={() => createFunction()}>
                  Create a new function
                </Button>
              </Tooltip.Trigger>
              {!canCreateFunctions && (
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      You need additional permissions to create functions
                    </span>
                  </div>
                </Tooltip.Content>
              )}
            </Tooltip.Root>
          </div>
          {filteredFunctions.length <= 0 && (
            <div className="mx-auto flex max-w-lg items-center justify-center space-x-3 rounded border p-6 shadow-md dark:border-dark">
              <p>No results match your filter query</p>
              <Button type="outline" onClick={() => setFilterString('')}>
                Reset filter
              </Button>
            </div>
          )}
          {filteredFunctionSchemas.map((schema: any) => (
            <SchemaTable
              key={schema}
              filterString={filterString}
              schema={schema}
              editFunction={editFunction}
              deleteFunction={deleteFunction}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default observer(FunctionsList)
