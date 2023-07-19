import Link from 'next/link'
import { Button, IconSettings } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

const SettingsButton = ({ slug }: { slug: string }) => {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger type="button">
        <Link href={`/org/${slug}/general`}>
          <a>
            <Button
              type="text"
              className="px-1"
              icon={<IconSettings size={18} strokeWidth={1.5} className="text-scale-1100" />}
            />
          </a>
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
              'border border-scale-200',
            ].join(' ')}
          >
            <span className="text-xs text-scale-1200">Settings</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default SettingsButton
