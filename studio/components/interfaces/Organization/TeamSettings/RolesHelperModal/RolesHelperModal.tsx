import { FC, Fragment, useState } from 'react'
import { IconCheck, IconHelpCircle, Modal } from '@supabase/ui'
import { useFlag } from 'hooks'
import { PERMISSIONS_MAPPING } from './RolesHelperModal.constants'

interface Props {}

const RolesHelperModal: FC<Props> = ({}) => {
  const [showModal, setShowModal] = useState(false)
  const enableBillingOnlyReadOnlyRoles = useFlag('enableBillingOnlyReadOnlyRoles')

  const permissionColumnClassName = [
    `${enableBillingOnlyReadOnlyRoles ? 'w-[40%]' : 'w-[49%]'}`,
    'text-sm pl-4 font-bold',
  ].join(' ')
  const roleColumnClassName = [
    `${enableBillingOnlyReadOnlyRoles ? 'w-[12%]' : 'w-[17%]'}`,
    'text-sm h-8 flex items-center justify-center border-l border-scale-600 font-bold',
  ].join(' ')

  return (
    <>
      <IconHelpCircle
        size={16}
        strokeWidth={1.5}
        className="cursor-pointer hover:text-scale-1200 transition"
        onClick={() => setShowModal(!showModal)}
      />
      <Modal
        closable
        hideFooter
        visible={showModal}
        size={enableBillingOnlyReadOnlyRoles ? 'xxlarge' : 'xlarge'}
        header="Permissions for each role"
        onCancel={() => setShowModal(!showModal)}
      >
        <div className="py-4 space-y-4">
          <Modal.Content>
            <p className="text-sm">
              The following table shows the corresponding permissions for each available role in the
              dashboard.
            </p>
          </Modal.Content>
          <Modal.Content>
            <div className="bg-scale-400 border border-scale-500 rounded">
              <div className="flex items-center border-b border-scale-600">
                <div className={permissionColumnClassName}>Permissions</div>
                <div className={roleColumnClassName}>Owner</div>
                <div className={roleColumnClassName}>Adminstrator</div>
                <div className={roleColumnClassName}>Developer</div>
                {enableBillingOnlyReadOnlyRoles && (
                  <div className={roleColumnClassName}>Read-only</div>
                )}
                {enableBillingOnlyReadOnlyRoles && (
                  <div className={roleColumnClassName}>Billing-only</div>
                )}
              </div>

              <div className="max-h-[425px] overflow-y-auto">
                {PERMISSIONS_MAPPING.map((group) => (
                  <Fragment key={group.title}>
                    <div className="flex items-center py-2 px-4 border-b border-scale-600 last:border-none">
                      <div className="text-sm w-[100%]">{group.title}</div>
                    </div>
                    {group.actions.map((action, idx) => (
                      <div
                        key={`${group.title}-${idx}`}
                        className="bg-scale-500 flex items-center border-b border-scale-600 last:border-none"
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
                        {enableBillingOnlyReadOnlyRoles && (
                          <div className={roleColumnClassName}>
                            {action.permissions.read_only && (
                              <IconCheck size={14} strokeWidth={2} />
                            )}
                          </div>
                        )}
                        {enableBillingOnlyReadOnlyRoles && (
                          <div className={roleColumnClassName}>
                            {action.permissions.billing_only && (
                              <IconCheck size={14} strokeWidth={2} />
                            )}
                          </div>
                        )}
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
