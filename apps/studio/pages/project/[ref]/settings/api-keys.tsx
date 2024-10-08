import { PermissionAction } from '@supabase/shared-types/out/constants'

import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import LegacyAPIKeys from 'components/interfaces/APIKeys/LegacyAPIKeys'
import PublishableAPIKeys from 'components/interfaces/APIKeys/PublishableAPIKeys'
import SecretAPIKeys from 'components/interfaces/APIKeys/SecretAPIKeys'
import { Separator } from 'ui'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input_Shadcn_,
  Label_Shadcn_,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import ApiKeysLayout from 'components/layouts/project/[ref]/settings/APIKeysLayout'

const AuthSettings: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  // TODO: check if these permissions cover third party auth as well
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')

  return (
    <>
      {!isPermissionsLoaded ? (
        <GenericSkeletonLoader />
      ) : !canReadAPIKeys ? (
        <NoPermission isFullPage resourceText="access your project's API keys" />
      ) : (
        <>
          <PublishableAPIKeys />
          <Separator />
          <SecretAPIKeys />
          <LegacyAPIKeys />

          <Tabs_Shadcn_ defaultValue="account" className="w-[400px]">
            <TabsList_Shadcn_ className="flex gap-2">
              <TabsTrigger_Shadcn_ value="account">Account</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="password">Password</TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
            <TabsContent_Shadcn_ value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Make changes to your account here. Click save when you are done.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label_Shadcn_ htmlFor="name">Name</Label_Shadcn_>
                    <Input_Shadcn_ id="name" defaultValue="Pedro Duarte" />
                  </div>
                  <div className="space-y-1">
                    <Label_Shadcn_ htmlFor="username">Username</Label_Shadcn_>
                    <Input_Shadcn_ id="username" defaultValue="@peduarte" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password here. After saving, you will be logged out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label_Shadcn_ htmlFor="current">Current password</Label_Shadcn_>
                    <Input_Shadcn_ id="current" type="password" />
                  </div>
                  <div className="space-y-1">
                    <Label_Shadcn_ htmlFor="new">New password</Label_Shadcn_>
                    <Input_Shadcn_ id="new" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save password</Button>
                </CardFooter>
              </Card>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </>
      )}
    </>
  )
}

AuthSettings.getLayout = (page) => (
  <SettingsLayout>
    <ApiKeysLayout>{page}</ApiKeysLayout>
  </SettingsLayout>
)
export default AuthSettings
