import { FC } from 'react'
import Link from 'next/link'
import { Button } from 'ui'
import { useParams } from 'hooks'

interface Props {
  currentOption?: any
}

const SupportPlan: FC<Props> = ({ currentOption }) => {
  const { ref } = useParams()
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-lg">Support Plan</h4>
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
