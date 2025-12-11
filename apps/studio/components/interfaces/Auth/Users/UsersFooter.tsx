import { THRESHOLD_COUNT } from '@supabase/pg-meta/src/sql/studio/get-count-estimate'
import { keepPreviousData } from '@tanstack/react-query'
import { HelpCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'
import { useParams } from 'common'
import { formatEstimatedCount } from 'components/grid/components/footer/pagination/Pagination.utils'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import type { Filter, SpecificFilterColumn } from './Users.constants'

interface UsersFooterProps {
  filter: Filter
  filterKeywords: string
  selectedProviders: string[]
  specificFilterColumn: SpecificFilterColumn
}

export const UsersFooter = ({
  filter,
  filterKeywords,
  selectedProviders,
  specificFilterColumn,
}: UsersFooterProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [forceExactCount, setForceExactCount] = useState(false)
  const [showFetchExactCountModal, setShowFetchExactCountModal] = useState(false)

  const {
    data: countData,
    isPending: isLoadingCount,
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
      // Use optimized search when filtering by specific column
      ...(specificFilterColumn !== 'freeform'
        ? { column: specificFilterColumn as OptimizedSearchColumns }
        : { column: undefined }),
    },
    { placeholderData: keepPreviousData }
  )
  const totalUsers = countData?.count ?? 0

  useEffect(() => {
    if (isSuccessCount && specificFilterColumn === 'freeform') {
      setForceExactCount(countData.is_estimate && countData.count <= THRESHOLD_COUNT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessCount, specificFilterColumn])

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
                        if (specificFilterColumn === 'freeform') {
                          setShowFetchExactCountModal(true)
                        }
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="w-80">
                    {specificFilterColumn === 'freeform' ? (
                      <>
                        This is an estimated value as your project has more than{' '}
                        {THRESHOLD_COUNT.toLocaleString()} users.
                        <br />
                        <span className="text-brand">Click to retrieve the exact count.</span>{' '}
                      </>
                    ) : (
                      <>
                        <p className="mb-1">
                          This is an estimated value which may not be accurate.
                        </p>
                        <p>
                          If you'd like to retrieve the exact count, change the search to{' '}
                          <span className="text-warning">all columns</span> from the header.
                        </p>{' '}
                      </>
                    )}
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
