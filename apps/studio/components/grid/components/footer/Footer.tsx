import { useParams } from 'common'
import { GridFooter } from 'components/ui/GridFooter'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike, isViewLike } from 'data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { Pagination } from './pagination'

export const Footer = () => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: project } = useSelectedProjectQuery()

  const { data: entity } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [{ view: selectedView = 'data' }, setUrlState] = useUrlState()

  const setSelectedView = (view: string) => {
    if (view === 'data') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  const isViewSelected = isViewLike(entity)
  const isTableSelected = isTableLike(entity)

  return (
    <GridFooter>
      {selectedView === 'data' && <Pagination />}

      <div className="ml-auto flex items-center gap-x-2">
        {(isViewSelected || isTableSelected) && (
          <TwoOptionToggle
            width={75}
            options={['definition', 'data']}
            activeOption={selectedView}
            borderOverride="border"
            onClickOption={setSelectedView}
          />
        )}
      </div>
    </GridFooter>
  )
}
