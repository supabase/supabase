import { useParams } from 'common'
import { useCreateRuleMutation } from 'data/advisors/rules-query'
import { Activity, Bell, CheckCircle2, Lightbulb, Play, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent } from 'ui'

import { SECURITY_TEMPLATE, PERFORMANCE_TEMPLATE } from '../Rules/rule-templates'

export function QuickSetupCard({ projectRef }: { projectRef: string }) {
  const createMutation = useCreateRuleMutation(projectRef)
  const [enabling, setEnabling] = useState(false)
  const [enabled, setEnabled] = useState(false)

  const handleEnableMonitoring = async () => {
    setEnabling(true)
    try {
      const allRules = [...SECURITY_TEMPLATE.rules, ...PERFORMANCE_TEMPLATE.rules]
      for (const rule of allRules) {
        await createMutation.mutateAsync(rule)
      }
      toast.success(`${allRules.length} monitoring rules enabled`)
      setEnabled(true)
    } catch (err) {
      toast.error('Failed to enable monitoring rules')
    } finally {
      setEnabling(false)
    }
  }

  if (enabled) {
    return (
      <Card className="border-brand-500/50 bg-brand-200/10">
        <CardContent className="flex flex-col items-center gap-3 py-8 px-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-brand" />
          <div>
            <p className="text-sm font-medium text-foreground">Monitoring enabled</p>
            <p className="text-xs text-foreground-lighter mt-1">
              Rules are active and will start detecting issues on their next scheduled run.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-8 px-6">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="rounded-full bg-surface-200 p-3">
            <Lightbulb className="h-6 w-6 text-foreground-lighter" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Welcome to Advisors</h2>
            <p className="text-sm text-foreground-lighter mt-2 max-w-md mx-auto">
              Advisors continuously monitors your project for security risks,
              performance issues, and misconfigurations &mdash; and helps you fix them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
            <SetupStep
              step={1}
              icon={<Play className="h-4 w-4" />}
              title="Enable Monitoring"
              description="Turn on 24 built-in rules for security and performance"
            />
            <SetupStep
              step={2}
              icon={<Bell className="h-4 w-4" />}
              title="Get Notified"
              description="Connect Slack or email for instant alerts"
            />
            <SetupStep
              step={3}
              icon={<Activity className="h-4 w-4" />}
              title="Stay Healthy"
              description="Advisors watch your project around the clock"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="primary"
              loading={enabling}
              onClick={handleEnableMonitoring}
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              Enable Recommended Rules
            </Button>
            <Button asChild type="default">
              <Link href={`/project/${projectRef}/advisors/monitoring-rules`}>
                Customize Rules
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SetupStep({
  step,
  icon,
  title,
  description,
}: {
  step: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-default bg-surface-100">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-surface-200 text-foreground-lighter">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-xs text-foreground-lighter mt-0.5">{description}</p>
      </div>
    </div>
  )
}
