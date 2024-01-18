import { useBreakpoint } from 'common'
import { noop } from 'lodash'
import Link from 'next/link'
import { Button } from 'ui'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  const isMobile = useBreakpoint(639)

  return (
    <div className="space-y-3 py-1 flex flex-col w-full">
      <div>
        <p className="text-foreground">
          We only collect analytics essential to ensuring smooth operation of our services.{' '}
          <Link
            className="inline sm:hidden underline text-light"
            target="_blank"
            rel="noreferrer"
            href="https://supabase.com/privacy"
          >
            Learn more
          </Link>
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          type="default"
          onClick={onAccept}
          size={isMobile ? 'small' : 'tiny'}
          block={isMobile}
        >
          Accept
        </Button>
        <Button
          type={isMobile ? 'outline' : 'text'}
          onClick={onOptOut}
          size={isMobile ? 'small' : 'tiny'}
          block={isMobile}
        >
          Opt out
        </Button>
        <Button asChild type="text" className="hidden sm:block text-light hover:text-foreground">
          <Link target="_blank" rel="noreferrer" href="https://supabase.com/privacy">
            Learn more
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default ConsentToast
