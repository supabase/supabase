import { useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button } from '@supabase/ui'

import { PageContext } from 'pages/project/[ref]/auth/users'

const UsersPagination = () => {
  const PageState: any = useContext(PageContext)

  function onNext() {
    PageState.fetchData(PageState.page + 1)
  }

  function onPrevious() {
    PageState.fetchData(PageState.page - 1)
  }

  return (
    <nav className="flex items-center justify-between overflow-hidden" aria-label="Pagination">
      <div className="hidden sm:block">
        <p className="text-xs text-gray-400">
          Showing
          <span className="px-1 font-medium text-gray-400">{PageState.fromRow}</span>
          to
          <span className="px-1 font-medium text-gray-400">{PageState.toRow}</span>
          of
          <span className="px-1 font-medium text-gray-400">{PageState.totalUsers}</span>
          results
        </p>
      </div>
      <div className="flex-1 flex justify-between sm:justify-end">
        {PageState.hasPrevious && (
          <Button type="secondary" disabled={!PageState.hasPrevious} onClick={onPrevious}>
            Previous
          </Button>
        )}
        {PageState.hasNext && (
          <Button type="secondary" disabled={!PageState.hasNext} className="ml-3" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </nav>
  )
}

export default observer(UsersPagination)
