import { partition } from 'lodash'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { wrappers } from './Wrappers.constants'
import WrapperCard from './WrapperCard'
import WrapperRow from './WrapperRow'
import { useState } from 'react'
import { Wrapper } from './Wrappers.types'

const Wrappers = () => {
  const { project } = useProjectContext()
  const { data, isLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [open, setOpen] = useState<string>('')

  const enabledWrapperNamesSet = new Set(data?.result.map((fdw) => fdw.name))
  // const enabledWrapperNamesSet = new Set(['stripe_server'])
  const [enabledWrappers, disabledWrappers] = partition(wrappers, (wrapper: Wrapper) =>
    enabledWrapperNamesSet.has(wrapper.server.name)
  )

  return (
    <div>
      <FormHeader
        title="Foreign Data Wrappers"
        description="Connect your database to external systems. Query your data warehouse directly from your database, or third-party APIs using SQL."
      />

      <div>
        {wrappers.map((wrapper) => {
          return (
            <WrapperRow
              wrapper={wrapper}
              isEnabled={enabledWrapperNamesSet.has(wrapper.server.name)}
              isOpen={open === wrapper.name}
              onOpen={(wrapperName) => {
                if (open !== wrapperName) setOpen(wrapperName)
                else setOpen('')
              }}
            />
          )
        })}
      </div>

      {/* [Joshen TODO] Once above is working, can remove below */}
      <div className="space-y-4 mt-20">
        <div className="w-full space-y-12">
          {enabledWrappers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg">Enabled wrappers</h4>
              <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2 xl:grid-cols-3">
                {enabledWrappers.map((wrapper) => (
                  <WrapperCard key={wrapper.name} wrapper={wrapper} enabled={true} />
                ))}
              </div>
            </div>
          )}

          {disabledWrappers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg">Available wrappers</h4>
              <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2 xl:grid-cols-3">
                {disabledWrappers.map((wrapper) => (
                  <WrapperCard key={wrapper.name} wrapper={wrapper} enabled={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wrappers
