import { ConsentForm } from '@/registry/default/blocks/oauth-consent-nextjs/components/consent-form'
import { Suspense } from 'react'

function ConsentPageFallback() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<ConsentPageFallback />}>
          <ConsentForm />
        </Suspense>
      </div>
    </div>
  )
}
