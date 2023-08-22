import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import { Button, Dropdown, IconPlus } from 'ui'

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
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                You need additional permissions to add wrappers
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return (
    <Dropdown
      side="bottom"
      align={align}
      size="small"
      overlay={
        <>
          {WRAPPERS.map((wrapper, idx) => (
            <Fragment key={idx}>
              <Link
                href={`/project/${ref}/database/wrappers/new?type=${wrapper.name.toLowerCase()}`}
              >
                <a>
                  <Dropdown.Item
                    key={wrapper.name}
                    icon={
                      <Image
                        src={wrapper.icon}
                        width={20}
                        height={20}
                        alt={`${wrapper.name} wrapper icon`}
                      />
                    }
                  >
                    {wrapper.label}
                  </Dropdown.Item>
                </a>
              </Link>
              {idx !== WRAPPERS.length - 1 && <Dropdown.Separator />}
            </Fragment>
          ))}
        </>
      }
    >
      <Button type="primary" icon={<IconPlus strokeWidth={1.5} />}>
        {buttonText}
      </Button>
    </Dropdown>
  )
}

export default observer(WrapperDropdown)
