import { observer } from 'mobx-react-lite'
import { Button, IconMoon, IconSun, Input, Listbox } from 'ui'

import { AccountLayout } from 'components/layouts'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import Panel from 'components/ui/Panel'
import { Profile as ProfileType, useProfileQuery } from 'data/profile/profile-query'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { useStore } from 'hooks'
import { useSession } from 'lib/auth'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  return (
    <div className="my-2">
      <ProfileCard />
    </div>
  )
}

User.getLayout = (page) => (
  <AccountLayout
    title="Supabase"
    breadcrumbs={[
      {
        key: `supabase-settings`,
        label: 'Preferences',
      },
    ]}
  >
    {page}
  </AccountLayout>
)

export default User

const ProfileCard = observer(() => {
  const { ui } = useStore()
  const { mutateAsync } = useProfileUpdateMutation()

  const { data: profile } = useProfileQuery()
  // TODO: ^ handle loading state

  const updateUser = async (model: any) => {
    try {
      await mutateAsync({
        firstName: model.first_name,
        lastName: model.last_name,
      })

      ui.setNotification({ category: 'success', message: 'Successfully saved profile' })
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: "Couldn't update profile. Please try again later.",
      })
    }
  }

  return (
    <article className="max-w-4xl p-4">
      <section>
        <Profile profile={profile} />
      </section>

      <section>
        {/* @ts-ignore */}
        <SchemaFormPanel
          title="Profile"
          schema={{
            type: 'object',
            required: [],
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
            },
          }}
          model={{
            first_name: profile?.first_name ?? '',
            last_name: profile?.last_name ?? '',
          }}
          onSubmit={updateUser}
        />
      </section>

      <section>
        <ThemeSettings />
      </section>
    </article>
  )
})

const Profile = ({ profile }: { profile?: ProfileType }) => {
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
                <p className="text-scale-1100 break-all">Password</p>
              </div>
              <div className="col-span-8">
                <Link href="/reset-password">
                  <a>
                    <Button type="default" size="medium">
                      Reset password
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Panel.Content>
    </Panel>
  )
}

const ThemeSettings = observer(() => {
  const { ui } = useStore()

  return (
    <Panel title={<h5 key="panel-title">Theme</h5>}>
      <Panel.Content>
        <Listbox
          value={ui.themeOption}
          label="Interface theme"
          descriptionText="Choose a theme preference"
          layout="horizontal"
          style={{ width: '50%' }}
          icon={
            ui.themeOption === 'light' ? (
              <IconSun />
            ) : ui.themeOption === 'dark' ? (
              <IconMoon />
            ) : undefined
          }
          onChange={(themeOption: any) => ui.onThemeOptionChange(themeOption)}
        >
          <Listbox.Option label="System default" value="system">
            System default
          </Listbox.Option>
          <Listbox.Option label="Dark" value="dark">
            Dark
          </Listbox.Option>
          <Listbox.Option label="Light" value="light">
            Light
          </Listbox.Option>
        </Listbox>
      </Panel.Content>
    </Panel>
  )
})
