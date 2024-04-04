import Link from 'next/link'
import { Button } from 'ui'

export default function PrizeActions() {
  return (
    <div className="w-full gap-2 flex items-center">
      <Button onClick={() => null} type="secondary" size="tiny" asChild>
        <Link href="/special-announcement">Claim your ticket</Link>
      </Button>
      <Button onClick={() => null} type="default" size="tiny" disabled>
        Hackathon coming soon
      </Button>
    </div>
  )
}
