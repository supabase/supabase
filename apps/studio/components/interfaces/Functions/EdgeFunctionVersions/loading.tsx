import { Card, CardContent, CardHeader, CardTitle, Skeleton } from 'ui'

export const EdgeFunctionVersionsLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle>Edge Function Versions</CardTitle>
    </CardHeader>
    <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border">
            <div className="flex justify-between">
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-x-3">
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-4 w-72" />
                <div className="flex items-center gap-x-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-64" />

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-hidden rounded border bg-muted p-3 text-xs space-y-2">
          {[...Array(12)].map((_, idx) => (
            <Skeleton
              key={idx}
              className={`h-3 ${idx % 4 === 0 ? 'w-11/12' : idx % 4 === 1 ? 'w-10/12' : idx % 4 === 2 ? 'w-9/12' : 'w-full'}`}
            />
          ))}
        </div>

        <Skeleton className="h-9 w-full" />
      </div>
    </CardContent>
  </Card>
)
