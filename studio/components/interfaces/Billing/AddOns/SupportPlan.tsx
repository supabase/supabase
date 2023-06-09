import Link from 'next/link'
import { FC, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { useParams } from 'common/hooks'

interface Props {
  currentOption?: any
}

const SupportPlan: FC<Props> = ({ currentOption }) => {
  const { ref } = useParams()
  const { asPath } = useRouter()
  useEffect(() => {
    const hash = asPath.split('#')[1]
    if (hash !== undefined) {
      window.location.hash = ''
      window.location.hash = hash
    }
  }, [asPath])
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 id="support-addon" className="text-lg">
            <Link href="#support-addon" prefetch={false}>
              <a>Support Plan</a>
            </Link>
          </h4>
        </div>
        <p className="text-sm text-scale-1100">Designated support with guaranteed response times</p>
      </div>
      <div
        className={[
          'flex items-center justify-between block w-full rounded px-4 py-3',
          'border border-scale-600 bg-scale-100 dark:border-scale-500 dark:bg-scale-400',
        ].join(' ')}
      >
        <div className="space-y-3">
          <h5 className="text-sm text-scale-1200">
            Your project is currently on {currentOption.name}
          </h5>
          <p className="text-sm text-scale-1100">
            If you would like to change your support plan, do reach out to us
          </p>
        </div>
        <div className="">
          <Link href={`/support/new?ref=${ref}&category=sales&subject=Change%20support%20plan`}>
            <a>
              <Button>Contact us</Button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SupportPlan
