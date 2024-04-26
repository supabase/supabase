'use client'

import Link from 'next/link'
import { Button } from 'ui'

const ErrorPage = () => (
  <div className="h-full w-full flex flex-col gap-8 p-8 items-center justify-center">
    <span className="text-center text-5xl text-foreground-lighter">
      Sorry, something went wrong
    </span>
    <Button asChild type="secondary" className="w-fit p-4 text-lg">
      <Link href="/">Return to homepage</Link>
    </Button>
  </div>
)

export default ErrorPage
