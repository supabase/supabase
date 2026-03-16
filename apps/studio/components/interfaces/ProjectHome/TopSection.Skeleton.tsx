import { Skeleton } from 'ui'

export const TopSectionSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-0 w-full items-center">
        <div className="flex flex-col">
          <div className="flex flex-row flex-wrap items-center gap-4 w-full">
            <div>
              <div className="flex items-center gap-x-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-5 w-64 mt-3" />
            </div>
          </div>
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 flex-wrap">
              <Skeleton className="h-[72px] w-full" />
              <Skeleton className="h-[72px] w-full" />
              <Skeleton className="h-[72px] w-full" />
              <Skeleton className="h-[72px] w-full" />
            </div>
          </div>
        </div>
        <div>
          <Skeleton className="w-full h-[400px] md:h-[500px] rounded-md" />
        </div>
      </div>
    </div>
  )
}
