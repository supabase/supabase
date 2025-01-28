import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import ApiKeysNotice from 'components/ui/ApiKeysNotice'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { Sparkles } from 'lucide-react'
import { PropsWithChildren } from 'react'
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  Input_Shadcn_,
  Label_Shadcn_,
  Separator,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  const [apiKeysView, setApiKeysViewState] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.API_KEYS_VIEW,
    'new-keys'
  )

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>API Keys</ScaffoldTitle>
          <ScaffoldDescription>
            Configure API keys that help secure your project
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10">
        <Tabs_Shadcn_
          defaultValue={apiKeysView}
          className="relative"
          value={apiKeysView}
          onValueChange={setApiKeysViewState}
        >
          <div className="flex-shrink-0">
            <TabsList_Shadcn_ className="inline-flex gap-1 p-1 bg-surface-75 bg-opacity-100 border rounded-lg">
              <TabsTrigger_Shadcn_
                value="new-keys"
                className={cn(
                  buttonVariants({
                    type: apiKeysView === 'new-keys' ? 'default' : 'text',
                    size: 'tiny',
                  }),
                  apiKeysView !== 'new-keys'
                    ? 'text-foreground-lighter'
                    : '!border-foreground-muted',
                  'flex gap-2'
                )}
              >
                <Sparkles size={13} strokeWidth={1.2} className="text-foreground-light" />
                New Keys
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="legacy-keys"
                className={cn(
                  buttonVariants({
                    type: apiKeysView === 'legacy-keys' ? 'default' : 'text',
                    size: 'tiny',
                  }),
                  apiKeysView !== 'legacy-keys'
                    ? 'text-foreground-lighter'
                    : '!border-foreground-muted'
                )}
              >
                Legacy Keys
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
          </div>
        </Tabs_Shadcn_>

        {/* <Tabs_Shadcn_ defaultValue="account" className="">
          <TabsList_Shadcn_ className="w-full gap-4">
            <TabsTrigger_Shadcn_ value="account" className="flex gap-2 items-center">
              <Sparkles
                className="text-foreground-lighter group-data-[state=active]:text-foreground group-hover:text-foreground transition-all "
                size={13}
                strokeWidth={1}
              />{' '}
              <span>New Keys</span>
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="password">
              <span>Legacy Keys</span>
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
        </Tabs_Shadcn_> */}
        {/* <ApiKeysNotice /> */}
      </ScaffoldContainer>

      <ScaffoldContainer className="flex flex-col gap-10 py-8" bottomPadding>
        <Separator />
        {children}
      </ScaffoldContainer>
    </>
  )
}

export default ApiKeysLayout
