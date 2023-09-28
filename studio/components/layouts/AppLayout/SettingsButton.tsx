import * as Tooltip from '@radix-ui/react-tooltip'
import { useSelectedOrganization } from 'hooks'
import Link from 'next/link'
import { IconSettings } from 'ui'

const SettingsButton = () => {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  return (
    <Tooltip.Root delayDuration={0}>
      <Link href={slug ? `/org/${slug}/general` : '/'} passHref>
        <Tooltip.Trigger type="button" asChild className="px-1">
          <a id="organization-settings">
            <IconSettings size={18} strokeWidth={1.5} className="text-scale-1100" />
          </a>
        </Tooltip.Trigger>
      </Link>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
              'border border-scale-200',
            ].join(' ')}
          >
            <span className="text-xs text-scale-1200">Organization settings</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default SettingsButton
