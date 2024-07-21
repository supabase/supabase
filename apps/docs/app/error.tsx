'use client'

import Link from 'next/link'
import { Button } from 'ui'

const ErrorPage = () => (
  <div className="h-[calc(100vh-var(--header-height))] w-full flex flex-col gap-8 p-8 items-center justify-center">
    <span className="text-center text-5xl text-foreground-lighter">
      Sorry, something went wrong
    </span>
    <div className="flex flex-row items-center gap-4">
      <Button asChild type="secondary" className="w-fit p-4 text-lg">
        <Link href="/">Return to homepage</Link>
      </Button>
      <Button type="secondary" className="w-fit p-4 text-lg" onClick={() => location.reload()}>
        Refresh page
      </Button>
    </div>
  </div>
)

export default ErrorPage
