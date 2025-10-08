import { Skeleton } from 'ui'

const SQLEditorLoadingSnippets = () => {
  return (
    <>
      <div className="flex flex-row h-6 px-3 items-center gap-3">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-40 h-4" />
      </div>
      <div className="flex flex-row h-6 px-3 items-center gap-3">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="flex flex-row h-6 px-3 items-center gap-3 opacity-75">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="flex flex-row h-6 px-3 items-center gap-3 opacity-50">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-40 h-4" />
      </div>
      <div className="flex flex-row h-6 px-3 items-center gap-3 opacity-25">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="w-20 h-4" />
      </div>
    </>
  )
}

export default SQLEditorLoadingSnippets
