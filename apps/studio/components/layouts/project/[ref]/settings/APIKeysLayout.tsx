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
  cn,
  Input_Shadcn_,
  Label_Shadcn_,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Separator,
} from 'ui'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { Sparkle, Sparkles } from 'lucide-react'

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
      <ScaffoldContainer className="flex flex-col gap-10">
        <div
          className={cn(
            'relative px-6 py-5 bg-studio flex flex-col lg:flex-row lg:justify-between gap-6 overflow-hidden lg:items-center border rounded-md'
          )}
        >
          <div
            className="absolute inset-0 -mt-[5px]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--background-200)/1) 0%, hsl(var(--background-200)/1) 30%, hsl(var(--background-200)/0) 100%),
                linear-gradient(to right, hsl(var(--border-default)/0.33) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border-default)/0.33) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 15px 15px, 15px 15px',
              backgroundPosition: '0 0, 0 0, 0 0',
            }}
          ></div>
          <div className="w-full relative flex flex-row gap-3 items-center">
            <div className="flex flex-col grow text-sm">
              <h4 className="text-foreground">New API keys are available</h4>
              <p className="text-foreground-light">
                New API keys are available. They are more secure and easier to manage than legacy
                API keys.
              </p>
            </div>
            <div className="flex gap-1 p-1 bg-surface-75 border rounded-lg">
              <Button
                type="default"
                className="border-foreground-muted"
                size="tiny"
                icon={<Sparkles />}
              >
                New Keys
              </Button>
              <Button type="text" className="text-foreground-lighter" size="tiny">
                Legacy Keys
              </Button>
            </div>
          </div>
        </div>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10 py-8" bottomPadding>
        <Separator />
        {children}
      </ScaffoldContainer>
    </div>
  )
}

export default ApiKeysLayout
