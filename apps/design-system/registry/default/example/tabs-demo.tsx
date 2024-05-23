import { Button } from 'ui'
import {
  Card_Shadcn_,
  CardContent_Shadcn_,
  CardDescription_Shadcn_,
  CardFooter_Shadcn_,
  CardHeader_Shadcn_,
  CardTitle_Shadcn_,
} from 'ui'
import { Input_Shadcn_ } from 'ui'
import { Label_Shadcn_ } from 'ui'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

export default function TabsDemo() {
  return (
    <Tabs_Shadcn_ defaultValue="account" className="w-[400px]">
      <TabsList_Shadcn_ className="grid w-full grid-cols-2">
        <TabsTrigger_Shadcn_ value="account">Account</TabsTrigger_Shadcn_>
        <TabsTrigger_Shadcn_ value="password">Password</TabsTrigger_Shadcn_>
      </TabsList_Shadcn_>
      <TabsContent_Shadcn_ value="account">
        <Card_Shadcn_>
          <CardHeader_Shadcn_>
            <CardTitle_Shadcn_>Account</CardTitle_Shadcn_>
            <CardDescription_Shadcn_>
              Make changes to your account here. Click save when you are done.
            </CardDescription_Shadcn_>
          </CardHeader_Shadcn_>
          <CardContent_Shadcn_ className="space-y-2">
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="name">Name</Label_Shadcn_>
              <Input_Shadcn_ id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="username">Username</Label_Shadcn_>
              <Input_Shadcn_ id="username" defaultValue="@peduarte" />
            </div>
          </CardContent_Shadcn_>
          <CardFooter_Shadcn_>
            <Button>Save changes</Button>
          </CardFooter_Shadcn_>
        </Card_Shadcn_>
      </TabsContent_Shadcn_>
      <TabsContent_Shadcn_ value="password">
        <Card_Shadcn_>
          <CardHeader_Shadcn_>
            <CardTitle_Shadcn_>Password</CardTitle_Shadcn_>
            <CardDescription_Shadcn_>
              Change your password here. After saving, you will be logged out.
            </CardDescription_Shadcn_>
          </CardHeader_Shadcn_>
          <CardContent_Shadcn_ className="space-y-2">
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="current">Current password</Label_Shadcn_>
              <Input_Shadcn_ id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label_Shadcn_ htmlFor="new">New password</Label_Shadcn_>
              <Input_Shadcn_ id="new" type="password" />
            </div>
          </CardContent_Shadcn_>
          <CardFooter_Shadcn_>
            <Button>Save password</Button>
          </CardFooter_Shadcn_>
        </Card_Shadcn_>
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}
