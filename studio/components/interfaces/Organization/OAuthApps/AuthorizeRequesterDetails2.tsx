import clsx from 'clsx'
import { FormPanel } from 'components/ui/Forms'
import { BASE_PATH } from 'lib/constants'
import { PropsWithChildren, useState } from 'react'
import { Button, Collapsible, IconCheck, IconChevronDown, IconLock } from 'ui'

export interface AuthorizeRequesterDetailsProps {
  icon: string | null
  name: string
  domain: string
}

const AuthorizeRequesterDetails = ({
  icon,
  name,
  domain,
  children,
}: PropsWithChildren<AuthorizeRequesterDetailsProps>) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center">
        <div
          className="w-14 h-14 md:w-16 md:h-16 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-full border border-scale-700"
          style={{
            backgroundImage: icon !== null ? `url('${icon}')` : 'none',
          }}
        >
          {icon === null && <p className="text-scale-1000 text-lg">{name[0]}</p>}
        </div>
        <div className="w-28 border-t border-scale-1100 border-dashed relative">
          <div
            className="flex items-center justify-center w-[24px] h-[24px] rounded-full bg-gradient-to-b from-brand-900 to-brand-800 absolute -top-[12px]"
            style={{ right: 'calc(50% - 12px)' }}
          >
            <IconCheck strokeWidth={4} size={14} />
          </div>
        </div>
        <div
          className={clsx(
            'w-14 h-14 md:w-16 md:h-16 rounded-full border border-scale-700',
            'flex items-center justify-center',
            'bg-gradient-to-b from-scale-600 to-scale-200'
          )}
        >
          <div
            className="w-full h-full bg-center bg-no-repeat bg-[length:40px_40px]"
            style={{
              backgroundImage: `url('${BASE_PATH}/img/supabase-logo.svg')`,
            }}
          />
        </div>
      </div>

      <h2 className="text-2xl text-center">Authorize {name}</h2>

      <FormPanel
        footer={
          <div className="flex items-center justify-end py-4 px-8">
            <div className="flex items-center space-x-2">
              <Button type="default">Decline</Button>
              <Button>Authorize {name}</Button>
            </div>
          </div>
        }
      >
        <div className="w-full md:w-[500px]">
          <div className="py-4 px-8">
            <p className="text-base text-scale-1200">
              {name} ({domain})
            </p>
            <p className="text-sm text-scale-1100">
              is requesting API access to your organization.
            </p>
            <div className="mt-2">{children}</div>
          </div>
          <div className="w-full border-t" />
          <div className="px-8 py-4">
            <Collapsible open={open} onOpenChange={setOpen}>
              <Collapsible.Trigger asChild>
                <div className="space-y-2 cursor-pointer">
                  <div className="w-full flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-surface-300 rounded-md border border-scale-600">
                      <IconLock strokeWidth={2} size={14} />
                    </div>
                    <p className="text-base">Permissions</p>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-scale-1100">
                      The application will be able to read and write the organization's settings
                      including all of its projects once authorized.
                    </p>
                    <div>
                      <IconChevronDown
                        size={16}
                        strokeWidth={2}
                        className={`text-scale-1100 ${open ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </Collapsible.Trigger>
              <Collapsible.Content asChild>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">This includes the following:</p>
                  <ul className="list-disc text-scale-1100 space-y-0.5">
                    <li className="text-sm ml-6">Create projects</li>
                    <li className="text-sm ml-6">Read projects</li>
                    <li className="text-sm ml-6">Modify projects</li>
                    <li className="text-sm ml-6">Delete projects</li>
                    <li className="text-sm ml-6">Read organization</li>
                    <li className="text-sm ml-6">Modify organization</li>
                    <li className="text-sm ml-6">Delete organization</li>
                  </ul>
                </div>
              </Collapsible.Content>
            </Collapsible>
          </div>
        </div>
      </FormPanel>
    </div>
  )
}

export default AuthorizeRequesterDetails
