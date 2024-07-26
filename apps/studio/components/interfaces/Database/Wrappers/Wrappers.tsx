import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import DeleteWrapperModal from './DeleteWrapperModal'
import WrapperRow from './WrapperRow'
import { WRAPPERS } from './Wrappers.constants'
import { wrapperMetaComparator } from './Wrappers.utils'
import WrappersDisabledState from './WrappersDisabledState'
import WrappersEmptyState from './WrappersEmptyState'

const Wrappers = ({ isEnabled }: { isEnabled: boolean }) => {
  const { project } = useProjectContext()
  const { data } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [open, setOpen] = useState<string>('')
  const [selectedWrapperToDelete, setSelectedWrapperToDelete] = useState<FDW>()

  const wrappers = data?.result ?? []

  return (
    <>
      {isEnabled ? (
        <div>
          {wrappers.length === 0 ? (
            <WrappersEmptyState />
          ) : (
            <>
              {WRAPPERS.map((wrapper, i) => {
                const createdWrappers = wrappers.filter((w) => wrapperMetaComparator(wrapper, w))

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
                      onSelectDelete={setSelectedWrapperToDelete}
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

      <DeleteWrapperModal
        selectedWrapper={selectedWrapperToDelete}
        onClose={() => setSelectedWrapperToDelete(undefined)}
      />
    </>
  )
}

export default Wrappers
