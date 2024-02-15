import Pagination from './pagination'
import useTable from 'hooks/misc/useTable'
import { useParams } from 'common'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useUrlState } from 'hooks'
import RefreshButton from '../header/RefreshButton'

export interface FooterProps {
  isLoading?: boolean
  isRefetching?: boolean
}

const Footer = ({ isLoading, isRefetching }: FooterProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: selectedTable } = useTable(id)

  const [{ view: selectedView = 'data' }, setUrlState] = useUrlState()

  const setSelectedView = (view: string) => {
    if (view === 'data') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  return (
    <div className="flex min-h-9 overflow-hidden items-center px-2 w-full border-t">
      {selectedView === 'data' && <Pagination isLoading={isLoading} />}

      <div className="ml-auto flex items-center gap-4">
        {selectedTable && selectedView === 'data' && (
          <RefreshButton table={selectedTable} isRefetching={isRefetching} />
        )}

        <TwoOptionToggle
          width={75}
          options={['definition', 'data']}
          activeOption={selectedView}
          borderOverride="border-gray-500"
          onClickOption={setSelectedView}
        />
      </div>
    </div>
  )
}

export default Footer
