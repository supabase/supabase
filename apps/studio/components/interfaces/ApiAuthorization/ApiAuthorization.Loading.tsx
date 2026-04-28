import type { ReactNode } from 'react'
import { Card, CardContent } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

export function ApiAuthorizationLoadingScreen(): ReactNode {
  return (
    <InterstitialLayout
      logo={<SupabaseLogo />}
      title={<ShimmeringLoader className="mx-auto h-7 w-28 max-w-full py-0" />}
      description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
    >
      <div className="px-6 pb-6">
        <span className="sr-only">Loading...</span>
        <div className="flex flex-col gap-5">
          <Card className="shadow-none">
            <CardContent className="flex items-center gap-3 border-none px-4 py-3">
              <ShimmeringLoader className="size-10 flex-shrink-0 rounded-lg py-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <ShimmeringLoader className="h-4 w-28 py-0" />
                <ShimmeringLoader className="h-3 w-20 py-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="space-y-3 border-none px-4 py-4">
              <ShimmeringLoader className="h-4 w-full py-0" />
              <ShimmeringLoader className="h-4 w-4/5 py-0" />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-2">
            <ShimmeringLoader className="h-10 w-full py-0" />
            <ShimmeringLoader className="h-10 w-full py-0" />
          </div>
        </div>
      </div>
    </InterstitialLayout>
  )
}
