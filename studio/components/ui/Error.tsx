import { useEffect } from 'react'
import Link from 'next/link'
import { Button, Typography } from '@supabase/ui'

export default function EmptyPageState({ error }: any) {
  useEffect(() => {
    console.error('Error', error)
  }, [])

  return (
    <div className="w-full h-full flex flex-col space-y-6 items-center justify-center mx-auto">
      <div className="w-[320px] flex flex-col items-center justify-center space-y-3">
        <Typography.Title level={3}>Something went wrong 🤕</Typography.Title>
        <Typography.Text className="text-center">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </Typography.Text>
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
      <Typography.Text type="secondary" small>
        Error: [{error?.code}] {error?.message}
      </Typography.Text>
    </div>
  )
}
