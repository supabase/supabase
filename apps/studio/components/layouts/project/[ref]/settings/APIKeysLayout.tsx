import { withAuth } from 'hooks/misc/withAuth'
import { PropsWithChildren } from 'react'
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
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>API Keys</ScaffoldTitle>
          <ScaffoldDescription>
            Configure API keys that help secure your project
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        {/* <Tabs_Shadcn_ defaultValue="account" className="w-[400px]">
          <TabsList_Shadcn_ className="flex gap-2">
            <TabsTrigger_Shadcn_ value="account">New API Keys</TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="password">Legacy API Keys</TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
        </Tabs_Shadcn_> */}
        <div className="flex justfify-between items-center bg-surface-100 border px-5 py-3 rounded-md">
          <div className="flex-1 text-sm">
            <h4 className="text-foreground">New API keys are available</h4>
            <p className="text-foreground-light">
              New API keys are available. They are more secure and easier to manage than legacy API
              keys.
            </p>
          </div>
          <div className="-space-x-px bg-surface-75 border p-1 rounded-md">
            <Button type="default" className="rounded-r-none border-foreground-muted">
              New API Keys
            </Button>
            <Button type="outline" className="rounded-l-none">
              Legacy API Keys
            </Button>
          </div>
        </div>
        {children}
      </ScaffoldContainer>
    </div>
  )
}

export default ApiKeysLayout
