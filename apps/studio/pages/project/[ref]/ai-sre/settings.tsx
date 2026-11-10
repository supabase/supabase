import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { SparklesIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Form,
  FormControl,
  FormField,
  GithubIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import AiSreLayout from '@/components/layouts/AiSreLayout/AiSreLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { AIOptInModal } from '@/components/ui/AIAssistantPanel/AIOptInModal'
import { useAiSreConfigQuery } from '@/data/ai-sre/ai-sre-config-query'
import { useAiSreConfigUpsertMutation } from '@/data/ai-sre/ai-sre-config-upsert-mutation'
import {
  AI_SRE_ACCESS_LEVEL_OPTIONS,
  AI_SRE_CADENCE_OPTIONS,
  AI_SRE_FOCUS_AREAS,
  DEFAULT_AI_SRE_SYSTEM_PROMPT,
} from '@/data/ai-sre/ai-sre.types'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import { useOrgAiOptInLevel, type AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'
import type { NextPageWithLayout } from '@/types'

const AI_OPT_IN_LABELS: Record<AiOptInLevel, string> = {
  disabled: 'Disabled',
  schema: 'Schema',
  schema_and_log: 'Schema and logs',
  schema_and_log_and_data: 'Schema, logs and data',
}

const FormSchema = z.object({
  enabled: z.boolean(),
  cadence: z.enum(['hourly', 'daily', 'weekly']),
  performanceOn: z.boolean(),
  performanceWeight: z.number().min(1).max(5),
  securityOn: z.boolean(),
  securityWeight: z.number().min(1).max(5),
  billingOn: z.boolean(),
  billingWeight: z.number().min(1).max(5),
  githubAccessLevel: z.enum(['read_only', 'draft_pr', 'merge_pr']),
})

type FormValues = z.infer<typeof FormSchema>

const FOCUS_LABELS: Record<(typeof AI_SRE_FOCUS_AREAS)[number], string> = {
  performance: 'Performance',
  security: 'Security',
  billing: 'Billing & scale',
}

const AiSreSettingsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const track = useTrack()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: githubConnection } = useProjectGitHubConnectionQuery({ ref })
  const connectionString = project?.connectionString

  const { aiOptInLevel } = useOrgAiOptInLevel()
  const isOptedIntoAi = aiOptInLevel !== 'disabled'
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)

  const { data: config, isPending } = useAiSreConfigQuery({ projectRef: ref, connectionString })

  const { mutate: upsertConfig, isPending: isSaving } = useAiSreConfigUpsertMutation({
    onSuccess: () => {
      toast.success('AI SRE settings saved')
      router.push(`/project/${ref}/ai-sre`)
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: config?.enabled ?? false,
      cadence: config?.cadence ?? 'daily',
      performanceOn: (config?.focusAreas.performance ?? 3) > 0,
      performanceWeight: config?.focusAreas.performance || 3,
      securityOn: (config?.focusAreas.security ?? 3) > 0,
      securityWeight: config?.focusAreas.security || 3,
      billingOn: (config?.focusAreas.billing ?? 3) > 0,
      billingWeight: config?.focusAreas.billing || 3,
      githubAccessLevel: config?.githubAccessLevel ?? 'read_only',
    },
    values: config
      ? {
          enabled: config.enabled,
          cadence: config.cadence,
          performanceOn: config.focusAreas.performance > 0,
          performanceWeight: config.focusAreas.performance || 3,
          securityOn: config.focusAreas.security > 0,
          securityWeight: config.focusAreas.security || 3,
          billingOn: config.focusAreas.billing > 0,
          billingWeight: config.focusAreas.billing || 3,
          githubAccessLevel: config.githubAccessLevel,
        }
      : undefined,
  })

  const onSubmit = (values: FormValues) => {
    if (!ref) return
    track('ai_sre_settings_updated', {
      enabled: values.enabled,
      cadence: values.cadence,
      githubAccessLevel: values.githubAccessLevel,
    })
    upsertConfig({
      projectRef: ref,
      connectionString,
      config: {
        enabled: values.enabled,
        cadence: values.cadence,
        focusAreas: {
          performance: values.performanceOn ? values.performanceWeight : 0,
          security: values.securityOn ? values.securityWeight : 0,
          billing: values.billingOn ? values.billingWeight : 0,
        },
        githubAccessLevel: values.githubAccessLevel,
        systemPrompt: config?.systemPrompt || DEFAULT_AI_SRE_SYSTEM_PROMPT,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  if (isPending) {
    return (
      <PageContainer size="large">
        <GenericSkeletonLoader />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>AI SRE settings</PageHeaderTitle>
            <PageHeaderDescription>
              Choose when the SRE runs, what it focuses on, and how far it may act.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 py-6">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <SparklesIcon size={20} className="mt-0.5 text-foreground-light" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base text-foreground">AI access</h2>
                      <Badge variant={isOptedIntoAi ? 'success' : 'warning'}>
                        {AI_OPT_IN_LABELS[aiOptInLevel]}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground-light">
                      The SRE uses your organization's AI opt-in level to decide what it may read
                      (schema, logs, data). It cannot run while AI access is disabled.
                    </p>
                  </div>
                </div>
                <Button type="button" onClick={() => setIsOptInModalOpen(true)}>
                  {isOptedIntoAi ? 'Manage' : 'Opt in'}
                </Button>
              </div>
              {!isOptedIntoAi && (
                <Admonition
                  type="warning"
                  title="AI access is off for this organization"
                  description="Opt in above so the SRE can read your project. Runs return a 403 until you do."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Enable AI SRE"
                    description="Turn the site reliability engineer on for this project."
                  >
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="cadence"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Run cadence"
                    description="How often the SRE checks your project."
                  >
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_SRE_CADENCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <div>
                <h2 className="text-base text-foreground">Focus areas</h2>
                <p className="text-sm text-foreground-light">
                  Tell the SRE what to prioritize, and how important each area is from 1 to 5.
                </p>
              </div>
              {AI_SRE_FOCUS_AREAS.map((area) => {
                const onField = `${area}On` as const
                const weightField = `${area}Weight` as const
                const isOn = form.watch(onField)
                return (
                  <div
                    key={area}
                    className="flex flex-col gap-3 border-t border-muted pt-4 first:border-t-0 first:pt-0"
                  >
                    <FormField
                      control={form.control}
                      name={onField}
                      render={({ field }) => (
                        <FormItemLayout layout="flex-row-reverse" label={FOCUS_LABELS[area]}>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                    {isOn && (
                      <FormField
                        control={form.control}
                        name={weightField}
                        render={({ field }) => (
                          <FormItemLayout label={`Importance: ${field.value}/5`}>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                className="max-w-xs"
                              />
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex items-start gap-3">
                <GithubIcon size={20} className="mt-0.5 text-foreground-light" />
                <div className="flex-1">
                  <h2 className="text-base text-foreground">GitHub repository</h2>
                  {githubConnection ? (
                    <p className="text-sm text-foreground-light">
                      Connected to{' '}
                      <span className="text-foreground">{githubConnection.repository.name}</span>.
                      The SRE can read this repository to tie a problem to the code that caused it.
                    </p>
                  ) : (
                    <p className="text-sm text-foreground-light">
                      No repository connected. Connect one from{' '}
                      <Button
                        variant="link"
                        className="px-0"
                        onClick={() => router.push(`/project/${ref}/integrations`)}
                      >
                        Integrations
                      </Button>{' '}
                      so the SRE can see your code.
                    </p>
                  )}
                </div>
              </div>
              <FormField
                control={form.control}
                name="githubAccessLevel"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="How far the SRE may go"
                    description="Read-only is the default. Draft and merge activate in a later iteration."
                  >
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_SRE_ACCESS_LEVEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <div>
                <h2 className="text-base text-foreground">Standard prompt</h2>
                <p className="text-sm text-foreground-light">
                  The instructions the SRE follows on every run. Read-only for now.
                </p>
              </div>
              <Textarea
                readOnly
                rows={4}
                value={config?.systemPrompt || DEFAULT_AI_SRE_SYSTEM_PROMPT}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              Save settings
            </Button>
          </div>
        </form>
      </Form>

      <AIOptInModal
        visible={isOptInModalOpen}
        onCancel={() => setIsOptInModalOpen(false)}
        onSaved={() => setIsOptInModalOpen(false)}
      />
    </PageContainer>
  )
}

AiSreSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <AiSreLayout title="AI SRE">{page}</AiSreLayout>
  </DefaultLayout>
)

export default AiSreSettingsPage
