import { noop } from 'lodash'
import Link from 'next/link'
import { Button } from 'ui'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  return (
    <div className="space-y-3">
      <div className="text-sm">
        <p>
          By default, we don't track you. This site{' '}
          <span className="underline font-medium">does not</span> use cookies 🍪
        </p>
        <p>Would you like to provide telemetry to improve your experience?</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button type="default" onClick={onAccept}>
          Accept
        </Button>
        <Button type="text" onClick={onOptOut}>
          Opt out
        </Button>
        <Link href="https://supabase.com/privacy">
          <a target="_blank" rel="noreferrer">
            <Button type="text">Learn more</Button>
          </a>
        </Link>
      </div>
    </div>
  )
}

export default ConsentToast
