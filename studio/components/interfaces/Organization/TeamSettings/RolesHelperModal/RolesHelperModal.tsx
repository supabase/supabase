import { FC, Fragment, useState } from 'react'
import { IconCheck, IconHelpCircle, IconInfo, Modal } from 'ui'
import { PERMISSIONS_MAPPING } from './RolesHelperModal.constants'
import * as Tooltip from '@radix-ui/react-tooltip'

interface Props {}

const RolesHelperModal: FC<Props> = ({}) => {
  const [showModal, setShowModal] = useState(false)

  const permissionColumnClassName = 'w-[40%] text-sm pl-4 font-bold'
  const roleColumnClassName =
    'w-[12%] text-sm h-8 flex items-center justify-center border-l border-scale-600 font-bold'

  const accessTooltip = (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <IconInfo size={14} strokeWidth={2} />
      </Tooltip.Trigger>
      <Tooltip.Content side="top">
        <Tooltip.Arrow className="radix-tooltip-arrow" />
        <div
          className={[
            'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
            'border border-scale-200 ', //border
          ].join(' ')}
        >
          <span className="text-xs text-scale-1200">Only available in Team/Enterprise plan.</span>
        </div>
      </Tooltip.Content>
    </Tooltip.Root>
  )

  return (
    <>
      <IconHelpCircle
        size={16}
        strokeWidth={1.5}
        className="cursor-pointer transition hover:text-scale-1200"
        onClick={() => setShowModal(!showModal)}
      />
      <Modal
        closable
        hideFooter
        visible={showModal}
        size={'xxlarge'}
        header="Permissions for each role"
        onCancel={() => setShowModal(!showModal)}
      >
        <div className="space-y-4 py-4">
          <Modal.Content>
            <p className="text-sm">
              The following table shows the corresponding permissions for each available role in the
              dashboard.
            </p>
          </Modal.Content>
          <Modal.Content>
            <div className="rounded border border-scale-500 bg-scale-400">
              <div className="flex items-center border-b border-scale-600">
                <div className={permissionColumnClassName}>Permissions</div>
                <div className={roleColumnClassName}>Owner</div>
                <div className={roleColumnClassName}>Adminstrator</div>
                <div className={roleColumnClassName}>Developer</div>
                <div className={roleColumnClassName}>Read-only&nbsp;{accessTooltip}</div>
                <div className={roleColumnClassName}>Billing-only&nbsp;{accessTooltip}</div>
              </div>

              <div className="max-h-[425px] overflow-y-auto">
                {PERMISSIONS_MAPPING.map((group) => (
                  <Fragment key={group.title}>
                    <div className="flex items-center border-b border-scale-600 py-2 px-4 last:border-none">
                      <div className="w-[100%] text-sm">{group.title}</div>
                    </div>
                    {group.actions.map((action, idx) => (
                      <div
                        key={`${group.title}-${idx}`}
                        className="flex items-center border-b border-scale-600 bg-scale-500 last:border-none"
                      >
                        <div className={permissionColumnClassName}>{action.description}</div>
                        <div className={roleColumnClassName}>
                          {action.permissions.owner && <IconCheck size={14} strokeWidth={2} />}
                        </div>
                        <div className={roleColumnClassName}>
                          {action.permissions.admin && <IconCheck size={14} strokeWidth={2} />}
                        </div>
                        <div className={roleColumnClassName}>
                          {action.permissions.developer && <IconCheck size={14} strokeWidth={2} />}
                        </div>
                        <div className={roleColumnClassName}>
                          {action.permissions.read_only && <IconCheck size={14} strokeWidth={2} />}
                        </div>
                        <div className={roleColumnClassName}>
                          {action.permissions.billing_only && (
                            <IconCheck size={14} strokeWidth={2} />
                          )}
                        </div>
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default RolesHelperModal
