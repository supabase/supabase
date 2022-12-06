import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { wrappers } from './data'
import WrapperCard from './WrapperCard'

const Wrappers = () => {
  const { project } = useProjectContext()
  const { data, isLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const enabledWrapperNamesSet = new Set(data?.result.map((fdw) => fdw.name))

  const enabledWrappers = wrappers.filter((wrapper) =>
    enabledWrapperNamesSet.has(wrapper.server.name)
  )
  const disabledWrappers = wrappers.filter(
    (wrapper) => !enabledWrapperNamesSet.has(wrapper.server.name)
  )

  return (
    <>
      <div className="p-4 space-y-4">
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
    </>
  )
}

export default Wrappers
