import Link from 'next/link'
import { AlertTriangle } from 'react-feather'

const index = () => {
  return (
    <Link
      href="https://github.com/orgs/supabase/discussions/17817"
      className="relative w-full h-12 border-b border-muted p-2 flex items-center group justify-center text-foreground bg-surface-100 hover:bg-surface-200 transition-colors overflow-hidden"
    >
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm">
          <div className="flex gap-2 items-center">
            <AlertTriangle className="w-4 h-4 hidden sm:block text-warning" />
            <p>Prepare for the pgBouncer and IPv4 deprecations on 26th January 2024</p>
          </div>
          <div className="hidden sm:block text-foreground-light group-hover:text-foreground">
            Learn more
          </div>
        </div>
      </div>
    </Link>
  )
}

export default index
