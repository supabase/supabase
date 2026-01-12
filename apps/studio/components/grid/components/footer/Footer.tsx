import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { GridFooter } from 'components/ui/GridFooter'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike, isViewLike } from 'data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Pagination } from './pagination/Pagination'

type FooterProps = {
  enableForeignRowsQuery?: boolean
}

export const Footer: React.FC<FooterProps> = ({ enableForeignRowsQuery = true }: FooterProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: project } = useSelectedProjectQuery()
  const [selectedView, setSelectedView] = useQueryState('view', parseAsString.withDefault('data'))

  const { data: entity } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const isViewSelected = isViewLike(entity)
  const isTableSelected = isTableLike(entity)

  return (
    <GridFooter>
      {selectedView === 'data' && <Pagination enableForeignRowsQuery={enableForeignRowsQuery} />}

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
