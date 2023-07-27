import { noop } from 'lodash'
import Link from 'next/link'
import { Button } from 'ui'
import { useRouter } from 'next/router'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  const { basePath } = useRouter()

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <p>
          This site <span className="underline font-medium">does not</span> use cookies 🍪
        </p>
        <p>We use friendly server side analytics to measure and improve your experience</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button type="default" onClick={onAccept}>
          Accept
        </Button>
        <Button type="text" onClick={onOptOut}>
          Opt out
        </Button>
        <Link href={`${basePath}/privacy`}>
          <a target="_blank" rel="noreferrer">
            <Button type="text">Learn more</Button>
          </a>
        </Link>
      </div>
    </div>
  )
}

export default ConsentToast
