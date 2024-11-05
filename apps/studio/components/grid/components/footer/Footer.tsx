import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GridFooter } from 'components/ui/GridFooter'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import {
  getTableLikeFromTableEditor,
  useTableEditorQuery,
} from 'data/table-editor/table-editor-query'
import { useUrlState } from 'hooks/ui/useUrlState'
import RefreshButton from '../header/RefreshButton'
import { Pagination } from './pagination'

export interface FooterProps {
  isRefetching?: boolean
}

const Footer = ({ isRefetching }: FooterProps) => {
  const { project } = useProjectContext()
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const selectedTable = getTableLikeFromTableEditor(data)
  const entityType = data?.entity

  const [{ view: selectedView = 'data' }, setUrlState] = useUrlState()

  const setSelectedView = (view: string) => {
    if (view === 'data') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  const isViewSelected =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
  const isTableSelected = entityType?.type === ENTITY_TYPE.TABLE

  return (
    <GridFooter>
      {selectedView === 'data' && <Pagination />}

      <div className="ml-auto flex items-center gap-x-2">
        {selectedTable && selectedView === 'data' && (
          <RefreshButton table={selectedTable} isRefetching={isRefetching} />
        )}

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

export default Footer
