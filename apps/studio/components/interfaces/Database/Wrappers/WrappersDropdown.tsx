import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { Fragment } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconPlus,
} from 'ui'

import { useParams } from 'common/hooks'
import { useCheckPermissions } from 'hooks'
import { WRAPPERS } from './Wrappers.constants'

interface WrapperDropdownProps {
  buttonText?: string
  align?: 'center' | 'end'
}

const WrapperDropdown = ({ buttonText = 'Add wrapper', align = 'end' }: WrapperDropdownProps) => {
  const { ref } = useParams()
  const canManageWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  if (!canManageWrappers) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button disabled type="primary" icon={<IconPlus strokeWidth={1.5} />}>
            {buttonText}
          </Button>
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
              <span className="text-xs text-foreground">
                You need additional permissions to add wrappers
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button type="primary" icon={<IconPlus strokeWidth={1.5} />}>
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align={align}>
        {WRAPPERS.map((wrapper, idx) => (
          <Fragment key={idx}>
            <DropdownMenuItem key={wrapper.name} className="space-x-2" asChild>
              <Link
                href={`/project/${ref}/database/wrappers/new?type=${wrapper.name.toLowerCase()}`}
              >
                <Image
                  src={wrapper.icon}
                  width={20}
                  height={20}
                  alt={`${wrapper.name} wrapper icon`}
                />
                <p>{wrapper.label}</p>
              </Link>
            </DropdownMenuItem>
            {idx !== WRAPPERS.length - 1 && <DropdownMenuSeparator />}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default observer(WrapperDropdown)
