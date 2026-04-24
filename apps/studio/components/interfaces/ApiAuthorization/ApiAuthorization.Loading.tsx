import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

export function ApiAuthorizationLoadingScreen(): ReactNode {
  return (
    <Card>
      <CardHeader>Authorize API access</CardHeader>
      <CardContent>
        <span className="sr-only">Loading...</span>
        <div className="flex gap-x-4 items-center">
          <ShimmeringLoader className="w-12 h-12 md:w-14 md:h-14" />
          <ShimmeringLoader className="h-6 w-64" />
        </div>

        <div className="flex flex-col gap-y-2 mt-4">
          <ShimmeringLoader className="w-1/4" />
          <ShimmeringLoader />
        </div>

        <div className="flex flex-col gap-y-2 mt-8">
          <ShimmeringLoader className="w-1/2" />
          <ShimmeringLoader />
        </div>
      </CardContent>
    </Card>
  )
}
