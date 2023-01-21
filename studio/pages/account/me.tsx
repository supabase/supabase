import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Alert, Button, Form, IconArrowRight, IconMoon, IconSun, Input, Listbox, Modal } from 'ui'

import { Session } from '@supabase/supabase-js'
import { AccountLayout } from 'components/layouts'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import Panel from 'components/ui/Panel'
import { useProfile, useStore } from 'hooks'
import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { auth } from 'lib/gotrue'
import { NextPageWithLayout } from 'types'
import Link from 'next/link'
import { useRouter } from 'next/router'

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
  const { mutateProfile } = useProfile()
  const user = ui.profile

  const updateUser = async (model: any) => {
    try {
      const updatedUser = await post(`${API_URL}/profile/update`, model)
      mutateProfile(updatedUser, false)
      ui.setProfile(updatedUser)
      ui.setNotification({ category: 'success', message: 'Successfully saved profile' })
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: "Couldn't update profile. Please try again later.",
      })
    }
  }

  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      const {
        data: { session },
      } = await auth.getSession()
      if (session && !cancel) setSession(session)
    })()

    return () => {
      cancel = true
    }
  }, [])

  return (
    <article className="max-w-4xl p-4">
      <section>
        <Profile session={session} />
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
            first_name: user?.first_name ?? '',
            last_name: user?.last_name ?? '',
          }}
          onSubmit={updateUser}
        />
      </section>

      <section>
        <ThemeSettings />
      </section>

      <section>
        <DeleteAccount />
      </section>
    </article>
  )
})

const Profile = observer(({ session }: any) => {
  const { ui } = useStore()

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
            value={ui.profile?.username ?? ''}
          />
          <Input
            readOnly
            disabled
            label="Email"
            layout="horizontal"
            value={ui.profile?.primary_email ?? ''}
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
})

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

const DeleteAccount = observer(() => {
  const { ui } = useStore()

  return (
    <Panel title={<p key="panel-title">Delete Account</p>}>
      <Panel.Content>
        <Alert
          withIcon
          variant="danger"
          // @ts-ignore
          title={
            <span className="text-red-900">Deleting this user will also remove its projects</span>
          }
        >
          <p className="text-red-900">
            Make sure you have made a backup if you want to keep your data
          </p>
          <DeleteUserButton />
        </Alert>
      </Panel.Content>
    </Panel>
  )
})

const DeleteUserButton = observer(() => {
  const router = useRouter()
  const { ui } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  const onConfirmDelete = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    const response = await delete_(`${API_URL}/profile`)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: response.error.message,
      })
      setSubmitting(false)
    } else {
      setSubmitting(false)

      // logout the user to clear local storage
      await auth.signOut()
      router.push('/')
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted your account`,
      })
    }
  }
  return (
    <>
      <div className="mt-2">
        <Button onClick={() => setIsOpen(true)} type="danger">
          Delete User
        </Button>
      </div>{' '}
      <Modal
        closable
        hideFooter
        size="small"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-scale-1200">Delete my account</h5>
            <span className="text-xs text-scale-900">Are you sure?</span>
          </div>
        }
      >
        <Form validateOnBlur initialValues={{ orgName: '' }} onSubmit={onConfirmDelete}>
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="space-y-4 py-3">
              <Modal.Content>
                <p className="text-sm text-scale-900">
                  This action <span className="text-scale-1200">cannot</span> be undone. This will
                  action will permanently delete the user.
                </p>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button
                  block
                  danger
                  size="small"
                  type="danger"
                  htmlType="submit"
                  loading={isSubmitting}
                >
                  I understand, delete my account.
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
})
