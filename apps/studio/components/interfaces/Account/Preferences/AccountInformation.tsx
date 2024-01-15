import { Button, Input } from 'ui'
import Link from 'next/link'

import Panel from 'components/ui/Panel'
import { useSession } from 'lib/auth'
import { Profile } from 'data/profile/types'

const AccountInformation = ({ profile }: { profile?: Profile }) => {
  const session = useSession()

  return (
    <Panel
      title={
        <h5 key="panel-title" className="mb-0">
          Account Information
        </h5>
      }
    >
      <Panel.Content>
        <div className="space-y-2">
          <Input
            readOnly
            disabled
            label="Username"
            layout="horizontal"
            value={profile?.username ?? ''}
          />
          <Input
            readOnly
            disabled
            label="Email"
            layout="horizontal"
            value={profile?.primary_email ?? ''}
          />
          {session?.user.app_metadata.provider === 'email' && (
            <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4">
              <div className="flex flex-col space-y-2 col-span-4 ">
                <p className="text-foreground-light break-all">Password</p>
              </div>
              <div className="col-span-8">
                <Button asChild type="default" size="medium">
                  <Link href="/reset-password">Reset password</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Panel.Content>
    </Panel>
  )
}

export default AccountInformation
