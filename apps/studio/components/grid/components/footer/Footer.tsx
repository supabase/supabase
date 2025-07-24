import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GridFooter } from 'components/ui/GridFooter'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike, isViewLike } from 'data/table-editor/table-editor-types'
import { useUrlState } from 'hooks/ui/useUrlState'
import { Pagination } from './pagination'

const Footer = () => {
  const { project } = useProjectContext()
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

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

  return <GridFooter>{selectedView === 'data' && <Pagination />}</GridFooter>
}

export default Footer
