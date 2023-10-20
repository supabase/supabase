import useEntityType from 'hooks/misc/useEntityType'
import Pagination from './pagination'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import useTable from 'hooks/misc/useTable'
import { useParams } from 'common'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useUrlState } from 'hooks'
import RefreshButton from '../header/RefreshButton'

export interface FooterProps {
  isLoading?: boolean
  isRefetching: boolean
}

const Footer = ({ isLoading, isRefetching }: FooterProps) => {
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: selectedTable, isLoading: isTableLoading } = useTable(id)

  const entityType = useEntityType(selectedTable?.id)
  const isTableSelected = entityType?.type === ENTITY_TYPE.TABLE
  const isViewSelected =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW

  const isLocked = EXCLUDED_SCHEMAS.includes(entityType?.schema ?? '')
  const canEditViaTableEditor = isTableSelected && !isLocked

  const [{ view: selectedView = 'data' }, setUrlState] = useUrlState()

  const setSelectedView = (view: string) => {
    if (view === 'data') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  return (
    <div className="bg-scale-100 px-2 w-full">
      <div className="flex h-10 items-center">
        {selectedView === 'data' && <Pagination isLoading={isLoading} />}

        {(isTableSelected || isViewSelected) && (
          <>
            {/* {canEditViaTableEditor && (
              <div className="h-[20px] w-px border-r border-scale-600"></div>
            )} */}
            <div className="ml-auto flex items-center gap-4">
              {selectedTable && <RefreshButton table={selectedTable} isRefetching={isRefetching} />}
              <TwoOptionToggle
                width={75}
                options={['definition', 'data']}
                activeOption={selectedView}
                borderOverride="border-gray-500"
                onClickOption={setSelectedView}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Footer
