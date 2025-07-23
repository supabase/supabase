'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Checkbox_Shadcn_,
} from 'ui'
import { IconPanel } from 'ui-patterns/IconPanel'
import { useBreakpoint } from 'common'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { cn } from 'ui'
import { Code, MousePointerClick, Check } from 'lucide-react'

const steps = [
  { id: 'step1', title: '1. Choose Workflow' },
  { id: 'step2', title: '2. Create a Project' },
  { id: 'step3', title: '3. Modify Schema' },
  { id: 'step4', title: '4. Configure Auth' },
  { id: 'step5', title: '5. Connect to App' },
  { id: 'step6', title: '6. Go to Production' },
  { id: 'step7', title: '7. Branching' },
]

type Workflow = 'code-first' | 'no-code'

interface WalkthroughClientPageProps {
  codeFirstSchemaContent: React.ReactNode
  noCodeSchemaContent: React.ReactNode
  codeFirstAuthConfig: React.ReactNode
  noCodeAuthConfig: React.ReactNode
  connectToAppContent: React.ReactNode
  createProjectContent: React.ReactNode
  codeFirstBranchingContent: React.ReactNode
  noCodeBranchingContent: React.ReactNode
}

const checklistItems = [
  {
    id: 'security',
    title: 'Security',
    description:
      'Enable RLS on tables, configure SSL and Network Restrictions, and use MFA to protect your account. Use the Security Advisor to find issues.',
  },
  {
    id: 'performance',
    title: 'Performance',
    description:
      'Add database indexes, perform load testing, and upgrade your database if needed. Use the Performance Advisor for suggestions.',
  },
  {
    id: 'availability',
    title: 'Availability',
    description:
      'Use a custom SMTP server for auth emails. For critical applications, upgrade to a paid plan and configure PITR and Read Replicas.',
  },
  {
    id: 'rate-limiting',
    title: 'Rate Limiting and Abuse Prevention',
    description: 'Be aware of rate limits. Use CAPTCHA on auth endpoints to prevent abuse.',
  },
  {
    id: 'status-page',
    title: 'Subscribe to Status Page',
    description: 'Stay informed about Supabase service status by subscribing to the status page.',
  },
]

const ProductionChecklist = () => {
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({})

  const handleCheckedChange = (id: string, checked: boolean) => {
    setCheckedState((prev) => ({ ...prev, [id]: checked }))
  }

  return (
    <div>
      <h2 className="text-3xl font-medium mb-2">Getting Ready for Production</h2>
      <p className="text-foreground-light text-lg mb-8">
        Here are the final steps to get your application ready for production users. This is a
        summary of our{' '}
        <a
          href="/docs/guides/deployment/going-into-prod"
          target="_blank"
          className="text-brand underline"
        >
          Production Checklist
        </a>
        .
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Production Checklist</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="text-foreground-light">
            {checklistItems.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  'flex items-start gap-4 py-4 px-6',
                  index < checklistItems.length - 1 && 'border-b'
                )}
              >
                <Checkbox_Shadcn_
                  id={item.id}
                  checked={checkedState[item.id] ?? false}
                  onCheckedChange={(checked) => handleCheckedChange(item.id, !!checked)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={item.id}
                    className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.title}
                  </label>
                  <p className="text-sm text-foreground-lighter">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export function WalkthroughClientPage({
  codeFirstSchemaContent,
  noCodeSchemaContent,
  codeFirstAuthConfig,
  noCodeAuthConfig,
  connectToAppContent,
  createProjectContent,
  codeFirstBranchingContent,
  noCodeBranchingContent,
}: WalkthroughClientPageProps) {
  const router = useRouter()
  const [workflow, setWorkflow] = useState<Workflow | null>('code-first')
  const [currentStep, setCurrentStep] = useState(steps[0].id)

  const handleNext = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    if (currentIndex === steps.length - 1) {
      router.push('/docs')
    } else if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const handleBack = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const Step1 = (
    <div>
      <h2 className="text-3xl font-medium mb-2">Choose Your Preferred Workflow</h2>
      <p className="mb-6 text-foreground-light">
        Supabase can be used in a code-first or no-code approach. When your needs change you can
        transition between the two.
      </p>
      <ToggleGroup
        type="single"
        value={workflow ?? ''}
        onValueChange={(value) => {
          setWorkflow(value ? (value as Workflow) : null)
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <ToggleGroupItem
          value="code-first"
          className="p-6 h-auto flex-col gap-2 border data-[state=on]:border-1 data-[state=on]:border"
          aria-label="Code-first"
        >
          <Code className="w-8 h-8 mb-2" strokeWidth={1.5} />
          <h3 className="font-bold">Code-first</h3>
          <p className="text-sm text-foreground-light font-normal">
            Your schema, functions and configuration are defined in code.
          </p>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="no-code"
          className="p-6 h-auto flex-col gap-2 border data-[state=on]:border-1 data-[state=on]:border"
          aria-label="No-code"
        >
          <MousePointerClick className="w-8 h-8 mb-2" strokeWidth={1.5} />
          <h3 className="font-bold">No-code</h3>
          <p className="text-sm text-foreground-light font-normal">
            Use the Supabase Dashboard to manage your database, functions and project configuration
          </p>
        </ToggleGroupItem>
      </ToggleGroup>
      {workflow && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ideal for</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {workflow === 'code-first' ? (
              <ul className="text-foreground-light">
                <li className="flex items-center gap-2 py-3 px-6 border-b">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Complex applications with custom business logic.
                </li>
                <li className="flex items-center gap-2 py-3 px-6 border-b">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Teams that use Git for version control and CI/CD.
                </li>
                <li className="flex items-center gap-2 py-3 px-6 border-b">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Automated testing and deployment pipelines.
                </li>
                <li className="flex items-center gap-2 py-3 px-6">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Projects that require fine-grained control over the database schema.
                </li>
              </ul>
            ) : (
              <ul className="text-foreground-light">
                <li className="flex items-center gap-2 py-3 px-6 border-b">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Rapid prototyping and MVPs.
                </li>
                <li className="flex items-center gap-2 py-3 px-6 border-b">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Internal tools and dashboards.
                </li>
                <li className="flex items-center gap-2 py-3 px-6 border-b">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Simple applications with standard features.
                </li>
                <li className="flex items-center gap-2 py-3 px-6">
                  <Check className="text-foreground-lighter" strokeWidth={1.5} size={16} />
                  Developers who prefer a visual interface for speed.
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const Step2 = <div>{createProjectContent}</div>

  const Step3 = (
    <div>
      <h2 className="text-3xl font-medium mb-2">Modifying Your Database Schema</h2>
      {!workflow ? (
        <p className="text-foreground-light">Please select a workflow in Step 1.</p>
      ) : workflow === 'code-first' ? (
        codeFirstSchemaContent
      ) : (
        noCodeSchemaContent
      )}
    </div>
  )

  const Step4 = (
    <div>
      <h2 className="text-3xl font-medium mb-2">Configure Authentication</h2>
      {!workflow ? (
        <p className="text-foreground-light">Please select a workflow in Step 1.</p>
      ) : workflow === 'code-first' ? (
        codeFirstAuthConfig
      ) : (
        noCodeAuthConfig
      )}
    </div>
  )

  const frameworks = [
    {
      tooltip: 'ReactJS',
      icon: '/docs/img/icons/react-icon',
      href: '/guides/getting-started/quickstarts/reactjs',
    },
    {
      tooltip: 'Next.js',
      icon: '/docs/img/icons/nextjs-icon',
      href: '/guides/getting-started/quickstarts/nextjs',
    },
    {
      tooltip: 'RedwoodJS',
      icon: '/docs/img/icons/redwoodjs-icon',
      href: '/guides/getting-started/quickstarts/redwoodjs',
    },
    {
      tooltip: 'Flutter',
      icon: '/docs/img/icons/flutter-icon',
      href: '/guides/getting-started/quickstarts/flutter',
    },
    {
      tooltip: 'Android Kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      href: '/guides/getting-started/quickstarts/kotlin',
    },
    {
      tooltip: 'SvelteKit',
      icon: '/docs/img/icons/svelte-icon',
      href: '/guides/getting-started/quickstarts/sveltekit',
    },
    {
      tooltip: 'SolidJS',
      icon: '/docs/img/icons/solidjs-icon',
      href: '/guides/getting-started/quickstarts/solidjs',
    },
    {
      tooltip: 'Vue',
      icon: '/docs/img/icons/vuejs-icon',
      href: '/guides/getting-started/quickstarts/vue',
    },
    {
      tooltip: 'Nuxt',
      icon: '/docs/img/icons/nuxt-icon',
      href: '/guides/getting-started/quickstarts/nuxtjs',
    },
    {
      tooltip: 'refine',
      icon: '/docs/img/icons/refine-icon',
      href: '/guides/getting-started/quickstarts/refine',
    },
  ]
  const [selectedFramework, setSelectedFramework] = useState<string | null>('Next.js')
  const isXs = useBreakpoint(639)
  const iconSize = isXs ? 'sm' : 'lg'

  const Step5 = (
    <div>
      <h2 className="text-3xl font-medium mb-2">Connecting to Your App</h2>
      <p className="mb-4 text-foreground-light text-lg">
        We have a quickstart for each of the following frameworks.
      </p>
      <div className="flex flex-wrap gap-2 my-8">
        {frameworks.map((f) => (
          <Button
            type="text"
            className="h-auto p-0"
            key={f.tooltip}
            onClick={() => setSelectedFramework(f.tooltip)}
          >
            <IconPanel
              iconSize={iconSize}
              hideArrow
              className="pointer-events-none"
              tooltip={f.tooltip}
              icon={f.icon}
            />
          </Button>
        ))}
      </div>
      {selectedFramework && connectToAppContent}
    </div>
  )

  const Step6 = <ProductionChecklist />

  const Step7 = (
    <div>
      <h2 className="text-3xl font-medium mb-2">Branching</h2>
      {!workflow ? (
        <p className="text-foreground-light">Please select a workflow in Step 1.</p>
      ) : workflow === 'code-first' ? (
        <div>{codeFirstBranchingContent}</div>
      ) : (
        <div>{noCodeBranchingContent}</div>
      )}
    </div>
  )

  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="bg-alternative relative">
      {workflow && (
        <ToggleGroup
          type="single"
          className="fixed top-16 right-8 z-50"
          value={workflow ?? ''}
          onValueChange={(value) => {
            if (value) setWorkflow(value as Workflow)
          }}
        >
          <ToggleGroupItem value="code-first" aria-label="Code-first workflow">
            <Code className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="no-code" aria-label="No-code workflow">
            <MousePointerClick className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      <Tabs value={currentStep} onValueChange={setCurrentStep} className="flex flex-col h-screen">
        <div className="flex-grow p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8">
            <TabsContent value="step1">{Step1}</TabsContent>
            <TabsContent value="step2">{Step2}</TabsContent>
            <TabsContent value="step3">{Step3}</TabsContent>
            <TabsContent value="step4">{Step4}</TabsContent>
            <TabsContent value="step5">{Step5}</TabsContent>
            <TabsContent value="step6">{Step6}</TabsContent>
            <TabsContent value="step7">{Step7}</TabsContent>
            <div className="mt-8 flex justify-between">
              <Button
                size="small"
                type="default"
                onClick={handleBack}
                disabled={currentIndex === 0}
              >
                Back
              </Button>
              <Button size="small" onClick={handleNext}>
                {currentIndex === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>

        <TabsList className="w-full flex justify-center gap-x-8 border-t bg-surface-75 p-4 sticky bottom-0 rounded-none">
          {steps.map((step) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              className="border-b-0 data-[state=active]:bg-surface-100 py-4 px-6 rounded-lg data-[state=active]:border-0"
            >
              {step.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
