import { noop } from 'lodash'
import Link from 'next/link'
import { Button } from 'ui'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  return (
    <div className="space-y-3 py-1">
      <div>
        <p className="text-foreground">
          We only collect analytics essential to ensuring smooth operation of our services.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button type="default" onClick={onAccept}>
          Accept
        </Button>
        <Button type="text" onClick={onOptOut}>
          Opt out
        </Button>
        <Link passHref target="_blank" rel="noreferrer" href="https://supabase.com/privacy">
          <Button asChild type="text">
            <a>Learn more</a>
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default ConsentToast
