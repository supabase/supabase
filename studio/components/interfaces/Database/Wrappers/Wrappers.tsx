import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink } from 'ui'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { WRAPPERS } from './Wrappers.constants'
import WrapperRow from './WrapperRow'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import WrappersDropdown from './WrappersDropdown'
import WrappersDisabledState from './WrappersDisabledState'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { groupBy } from 'lodash'

const Wrappers = () => {
  const { meta } = useStore()
  const { project } = useProjectContext()
  const { data, isLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [open, setOpen] = useState<string>('')

  const wrappers = data?.result ?? []
  const groupedWrappers = groupBy(wrappers, 'handler')

  const wrappersExtension = meta.extensions.byId('wrappers')
  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isLoadingExtensions = meta.extensions.isLoading

  const isWrappersEnabled =
    wrappersExtension !== undefined &&
    wrappersExtension?.installed_version !== null &&
    vaultExtension !== undefined &&
    vaultExtension?.installed_version !== null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-2 text-xl text-scale-1200">Foreign Data Wrappers</h3>
          <div className="text-sm text-scale-900">
            Query your data warehouse directly from your database, or third-party APIs using SQL.
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="">
            <a target="_blank">
              <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                Documentation
              </Button>
            </a>
          </Link>
          {isWrappersEnabled && <WrappersDropdown />}
        </div>
      </div>

      {isLoadingExtensions || isLoading ? (
        <div className="p-12 space-y-2 border rounded border-scale-500">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : isWrappersEnabled ? (
        <div>
          {wrappers.length === 0 ? (
            <div
              className={[
                'border rounded border-scale-500 px-20 py-16',
                'flex flex-col items-center justify-center space-y-4',
              ].join(' ')}
            >
              <p className="text-sm">No wrappers created yet</p>
              <WrappersDropdown align="center" buttonText="Create a new wrapper" />
            </div>
          ) : (
            <>
              {/* [Joshen] This probably needs to change anyways so dont get too stuck with this */}
              {WRAPPERS.map((wrapper, i) => {
                const createdWrappers = groupedWrappers[wrapper.handlerName] ?? []
                if (createdWrappers.length > 0) {
                  return (
                    <WrapperRow
                      key={i}
                      wrapperMeta={wrapper}
                      wrappers={createdWrappers}
                      isOpen={open === wrapper.name}
                      onOpen={(wrapperName) => {
                        if (open !== wrapperName) setOpen(wrapperName)
                        else setOpen('')
                      }}
                    />
                  )
                } else {
                  return null
                }
              })}
            </>
          )}
        </div>
      ) : (
        <WrappersDisabledState />
      )}
    </div>
  )
}

export default observer(Wrappers)
