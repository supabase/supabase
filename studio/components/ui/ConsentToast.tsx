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
          <span className="underline font-medium">No cookies. 🍪</span>
        </p>
        <p>
          We only collect the essential analytics that help us build and improve the amazing open
          source product you love.
        </p>
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
