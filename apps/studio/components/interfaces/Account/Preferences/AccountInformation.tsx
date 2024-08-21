import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import Panel from 'components/ui/Panel'
import type { Profile } from 'data/profile/types'
import { useSession } from 'lib/auth'
import {
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'

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
        <div className="grid gap-4">
          <div className="grid grid-cols-12 gap-6">
            <Label_Shadcn_ className="col-span-4 text-foreground-light">Username</Label_Shadcn_>
            <Input_Shadcn_
              className="col-span-8"
              readOnly
              disabled
              placeholder="Username"
              value={profile?.username ?? ''}
            />
          </div>
          <div className="grid grid-cols-12 gap-6">
            <Label_Shadcn_ className="col-span-4 text-foreground-light">Email</Label_Shadcn_>

            <div className="col-span-8">
              <Input_Shadcn_
                className="w-full"
                readOnly
                disabled
                placeholder="Email"
                value={profile?.primary_email ?? ''}
              />
              <div className="col-span-8 mt-4">
                <Collapsible_Shadcn_ className="-mt-1.5 pb-1.5">
                  <CollapsibleTrigger_Shadcn_ className="group  font-normal p-0 [&[data-state=open]>div>svg]:!-rotate-180">
                    <div className="flex items-center gap-x-2 w-full">
                      <p className="text-xs text-foreground-light group-hover:text-foreground transition">
                        How can I change my email?
                      </p>
                      <ChevronDown
                        className="transition-transform duration-200"
                        strokeWidth={1.5}
                        size={14}
                      />
                    </div>
                  </CollapsibleTrigger_Shadcn_>
                  <CollapsibleContent_Shadcn_ className=" mt-2">
                    <div className="bg-surface-200 p-4 rounded-lg grid gap-4">
                      {session?.user.app_metadata.provider === 'email' ? (
                        <div>
                          <ol className="text-sm ml-4 pl-2 list-decimal">
                            <li>Create a new account with the new email</li>
                            <li>Invite this email to be an owner of the Org</li>
                            <li>Join the Org</li>
                            <li>Remove the old email from the Org</li>
                            <li>Email Supabase Support to delete the old email (Optional) </li>
                          </ol>
                        </div>
                      ) : (
                        <div>
                          <ol className="text-sm ml-4 pl-2 list-decimal">
                            <li>Log out of Supabase</li>
                            <li>
                              Change your Primary Email in{' '}
                              <Link href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/changing-your-primary-email-address">
                                GitHub
                              </Link>{' '}
                              (your public, not primary email)
                            </li>
                            <li>Log out of GitHub</li>
                            <li>
                              Log back into GitHub (with the new, desired email set as primary)
                            </li>
                            <li>Log back into Supabase</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent_Shadcn_>
                </Collapsible_Shadcn_>
              </div>
            </div>
          </div>
          {session?.user.app_metadata.provider === 'email' && (
            <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4">
              <div className="flex flex-col space-y-2 col-span-4 ">
                <p className="text-foreground-light break-all">Password</p>
              </div>
              <div className="col-span-8">
                <Button asChild type="default">
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
