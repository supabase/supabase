import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from 'ui'

export default function EmptyPageState({ error }: any) {
  useEffect(() => {
    console.error('Error', error)
  }, [])

  return (
    <div className="mx-auto flex h-full w-full flex-col items-center justify-center space-y-6">
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Something went wrong 🤕</h4>
        <p className="text-center text-sm text-foreground-light">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Button asChild>
          <Link href="/projects">Head back</Link>
        </Button>
        <Button asChild type="secondary">
          <Link href="/support/new">Submit a support request</Link>
        </Button>
      </div>
      <p className="text-sm text-foreground-light">
        Error: [{error?.code}] {error?.message}
      </p>
    </div>
  )
}
