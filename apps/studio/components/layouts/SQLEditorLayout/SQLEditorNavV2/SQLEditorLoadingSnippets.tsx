import { cn, Skeleton } from 'ui'

import { SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME } from './SQLEditorNav.constants'

const loadingRowClassName = cn(
  'flex flex-row items-center gap-3 px-3',
  SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME
)

export const SQLEditorLoadingSnippets = () => {
  return (
    <>
      <div className={loadingRowClassName}>
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-40 h-4" />
      </div>
      <div className={loadingRowClassName}>
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className={cn(loadingRowClassName, 'opacity-75')}>
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className={cn(loadingRowClassName, 'opacity-50')}>
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-40 h-4" />
      </div>
      <div className={cn(loadingRowClassName, 'opacity-25')}>
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-20 h-4" />
      </div>
    </>
  )
}
