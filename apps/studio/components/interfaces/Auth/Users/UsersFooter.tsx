import { HelpCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { formatEstimatedCount } from 'components/grid/components/footer/pagination/Pagination.utils'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { THRESHOLD_COUNT } from 'data/table-rows/table-rows-count-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { Filter } from './Users.constants'

interface UsersFooterProps {
  filter: Filter
  filterKeywords: string
  selectedProviders: string[]
}

export const UsersFooter = ({ filter, filterKeywords, selectedProviders }: UsersFooterProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [forceExactCount, setForceExactCount] = useState(false)
  const [showFetchExactCountModal, setShowFetchExactCountModal] = useState(false)

  const {
    data: countData,
    isLoading: isLoadingCount,
    isFetching: isFetchingCount,
    isSuccess: isSuccessCount,
  } = useUsersCountQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: filterKeywords,
      filter: filter === 'all' ? undefined : filter,
      providers: selectedProviders,
      forceExactCount,
    },
    { keepPreviousData: true }
  )
  const totalUsers = countData?.count ?? 0

  useEffect(() => {
    if (isSuccessCount) {
      setForceExactCount(countData.is_estimate && countData.count <= THRESHOLD_COUNT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessCount])

  return (
    <>
      <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
        <div className="flex items-center gap-x-2">
          {isLoadingCount || isFetchingCount || countData === undefined ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </span>
          ) : (
            <>
              <span>
                Total:{' '}
                {countData?.is_estimate
                  ? formatEstimatedCount(totalUsers)
                  : totalUsers.toLocaleString()}{' '}
                user{totalUsers !== 1 ? 's' : ''}
                {countData?.is_estimate && ' (estimated)'}
              </span>
              {countData?.is_estimate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="tiny"
                      type="text"
                      className="px-1.5"
                      icon={<HelpCircle />}
                      onClick={() => {
                        setShowFetchExactCountModal(true)
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="w-72">
                    This is an estimated value as your project has more than{' '}
                    {THRESHOLD_COUNT.toLocaleString()} users.
                    <br />
                    <span className="text-brand">Click to retrieve the exact count.</span>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        variant="warning"
        visible={showFetchExactCountModal}
        title="Fetch exact user count"
        confirmLabel="Fetch exact count"
        onCancel={() => setShowFetchExactCountModal(false)}
        onConfirm={() => {
          setForceExactCount(true)
          setShowFetchExactCountModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Your project has more than {THRESHOLD_COUNT.toLocaleString()} users, and fetching the
          exact count may cause performance issues on your database.
        </p>
      </ConfirmationModal>
    </>
  )
}
