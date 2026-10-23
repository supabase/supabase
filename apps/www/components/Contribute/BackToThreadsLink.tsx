import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackToThreadsLink() {
  return (
    <Link
      href="/contribute"
      className="inline-flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft className="h-3 w-3" />
      Threads
    </Link>
  )
}
