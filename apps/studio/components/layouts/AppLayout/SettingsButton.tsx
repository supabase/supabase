import * as Tooltip from '@radix-ui/react-tooltip'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import { IconSettings } from 'ui'

const SettingsButton = () => {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger type="button" asChild className="px-1">
        <Link id="organization-settings" href={slug ? `/org/${slug}/general` : '/'}>
          <IconSettings size={18} strokeWidth={1.5} className="text-foreground-light" />
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'border border-background',
            ].join(' ')}
          >
            <span className="text-xs text-foreground">Organization settings</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default SettingsButton
