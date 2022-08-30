import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@supabase/ui'

export default function EmptyPageState({ error }: any) {
  useEffect(() => {
    console.error('Error', error)
  }, [])

  return (
    <div className="mx-auto flex h-full w-full flex-col items-center justify-center space-y-6">
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Something went wrong 🤕</h4>
        <p className="text-scale-1100 text-center text-sm">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/">
          <a>
            <Button>Head back</Button>
          </a>
        </Link>
        <Link href="/support/new">
          <a>
            <Button type="secondary">Submit a support request</Button>
          </a>
        </Link>
      </div>
      <p className="text-scale-1100 text-sm">
        Error: [{error?.code}] {error?.message}
      </p>
    </div>
  )
}
