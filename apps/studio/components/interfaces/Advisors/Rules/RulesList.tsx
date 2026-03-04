import { useParams } from 'common'
import { useExecuteRuleMutation, type ExecuteRuleResult } from 'data/advisors/alerts-query'
import {
  useAdvisorRulesQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
} from 'data/advisors/rules-query'
import type { AdvisorRule, AdvisorSeverity } from 'data/advisors/types'
import {
  AlertOctagon,
  AlertTriangle,
  Code,
  Edit,
  Info,
  MoreVertical,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trash,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Separator,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { RuleTemplates } from './RuleTemplates'

const severityIcons: Record<string, typeof AlertOctagon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
}

const categoryIcons: Record<string, typeof ShieldCheck> = {
  security: ShieldCheck,
  performance: Zap,
}

const RuleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1),
  source: z.string().min(1),
  severity: z.enum(['critical', 'warning', 'info']),
  level: z.enum(['ERROR', 'WARN', 'INFO']),
  schedule: z.string().min(1, 'Schedule is required'),
  cooldown_seconds: z.number().min(0),
  sql_query: z.string().optional(),
  is_enabled: z.boolean(),
})

export function RulesList() {
  const { ref: projectRef } = useParams()
  const { data: rules, isLoading } = useAdvisorRulesQuery(projectRef)
  const [filterString, setFilterString] = useState('')
  const [showSheet, setShowSheet] = useState(false)
  const [editingRule, setEditingRule] = useState<AdvisorRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<AdvisorRule | null>(null)

  const updateMutation = useUpdateRuleMutation(projectRef)
  const deleteMutation = useDeleteRuleMutation(projectRef)
  const executeMutation = useExecuteRuleMutation(projectRef)

  const filteredRules = useMemo(() => {
    const list = rules ?? []
    if (!filterString) return list
    const q = filterString.toLowerCase()
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    )
  }, [rules, filterString])

  if (isLoading) return <GenericSkeletonLoader />

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <RuleTemplates existingRuleNames={(rules ?? []).map((r) => r.name)} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <Input
            placeholder="Search rules"
            size="tiny"
            icon={<Search />}
            value={filterString}
            className="w-full lg:w-52"
            onChange={(e) => setFilterString(e.target.value)}
          />
          <Button
            icon={<Plus />}
            onClick={() => {
              setEditingRule(null)
              setShowSheet(true)
            }}
          >
            New Rule
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <p className="text-foreground-lighter">No rules found</p>
                  </TableCell>
                </TableRow>
              )}
              {filteredRules.map((rule) => {
                const SevIcon = severityIcons[rule.severity] ?? Info
                const CatIcon = categoryIcons[rule.category] ?? Code
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CatIcon className="h-4 w-4 text-foreground-lighter shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{rule.title}</span>
                            {rule.is_system && <Badge variant="default">System</Badge>}
                          </div>
                          <p className="text-xs text-foreground-lighter truncate max-w-xs">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-foreground-lighter">
                      {rule.category}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <SevIcon className="h-3 w-3" />
                        <Badge
                          variant={
                            rule.severity === 'critical'
                              ? 'destructive'
                              : rule.severity === 'warning'
                                ? 'warning'
                                : 'default'
                          }
                        >
                          {rule.severity}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-foreground-lighter">{rule.schedule}</code>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_enabled}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate(
                            { ruleId: rule.id, is_enabled: checked },
                            {
                              onSuccess: () =>
                                toast.success(
                                  `Rule ${checked ? 'enabled' : 'disabled'}`
                                ),
                            }
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="default" className="px-1" icon={<MoreVertical />} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end" className="w-48">
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => {
                              executeMutation.mutate(rule.id, {
                                onSuccess: (result: ExecuteRuleResult) => {
                                  switch (result.status) {
                                    case 'alert_created':
                                      toast.success(
                                        `Found ${result.rowCount} result${result.rowCount !== 1 ? 's' : ''} — alert created. Check Alerts page.`
                                      )
                                      break
                                    case 'no_findings':
                                      toast.info('Rule executed successfully — no issues found')
                                      break
                                    case 'cooldown':
                                      toast.warning(
                                        `Found ${result.rowCount} result${result.rowCount !== 1 ? 's' : ''} but cooldown is active — skipped alert creation`
                                      )
                                      break
                                    case 'rule_not_found':
                                      toast.warning('Rule not found or is disabled')
                                      break
                                    default:
                                      toast.success('Rule executed')
                                  }
                                },
                                onError: (err) =>
                                  toast.error(`Rule execution failed: ${err.message}`),
                              })
                            }}
                          >
                            <Play size={12} />
                            <p>Run now</p>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => {
                              setEditingRule(rule)
                              setShowSheet(true)
                            }}
                          >
                            <Edit size={12} />
                            <p>Edit rule</p>
                          </DropdownMenuItem>
                          {!rule.is_system && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => setDeletingRule(rule)}
                              >
                                <Trash size={12} />
                                <p>Delete rule</p>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <RuleEditorSheet
        visible={showSheet}
        rule={editingRule}
        projectRef={projectRef!}
        onClose={() => {
          setShowSheet(false)
          setEditingRule(null)
        }}
      />

      <ConfirmationModal
        variant="destructive"
        visible={!!deletingRule}
        title={`Delete rule "${deletingRule?.title}"`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingRule(null)}
        onConfirm={() => {
          if (!deletingRule) return
          deleteMutation.mutate(deletingRule.id, {
            onSuccess: () => {
              toast.success('Rule deleted')
              setDeletingRule(null)
            },
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete this rule? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

function RuleEditorSheet({
  visible,
  rule,
  projectRef,
  onClose,
}: {
  visible: boolean
  rule: AdvisorRule | null
  projectRef: string
  onClose: () => void
}) {
  const createMutation = useCreateRuleMutation(projectRef)
  const updateMutation = useUpdateRuleMutation(projectRef)
  const isEditing = !!rule
  const formId = 'rule-editor-form'

  const form = useForm<z.infer<typeof RuleFormSchema>>({
    resolver: zodResolver(RuleFormSchema),
    defaultValues: {
      name: '',
      title: '',
      description: '',
      category: 'general',
      source: 'sql',
      severity: 'warning',
      level: 'WARN',
      schedule: '0 */6 * * *',
      cooldown_seconds: 3600,
      sql_query: '',
      is_enabled: true,
    },
  })

  const handleOpen = () => {
    if (rule) {
      form.reset({
        name: rule.name,
        title: rule.title,
        description: rule.description ?? '',
        category: rule.category,
        source: rule.source,
        severity: rule.severity as 'critical' | 'warning' | 'info',
        level: rule.level as 'ERROR' | 'WARN' | 'INFO',
        schedule: rule.schedule,
        cooldown_seconds: rule.cooldown_seconds,
        sql_query: rule.sql_query ?? '',
        is_enabled: rule.is_enabled,
      })
    } else {
      form.reset()
    }
  }

  const onSubmit = async (values: z.infer<typeof RuleFormSchema>) => {
    if (isEditing && rule) {
      await updateMutation.mutateAsync({ ruleId: rule.id, ...values })
      toast.success('Rule updated')
    } else {
      await createMutation.mutateAsync(values)
      toast.success('Rule created')
    }
    onClose()
  }

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="default" className="flex flex-col gap-0" onOpenAutoFocus={handleOpen}>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Rule' : 'Create Custom Rule'}</SheetTitle>
        </SheetHeader>
        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="overflow-auto flex-grow px-0"
          >
            <SheetSection>
              <FormField_Shadcn_
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Name" description="Unique identifier">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="my_custom_rule" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Title" description="Display name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="My Custom Rule" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Description">
                    <FormControl_Shadcn_>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder="What this rule checks..."
                        className="resize-none"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="category"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Category">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="security">Security</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="performance">Performance</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="general">General</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="severity"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Severity">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="critical">Critical</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="warning">Warning</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="info">Info</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="schedule"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Schedule"
                    description="Cron expression"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="0 */6 * * *" className="font-mono" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="sql_query"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="SQL Query"
                    description="Returns rows when the condition is detected"
                  >
                    <FormControl_Shadcn_>
                      <Textarea
                        {...field}
                        rows={8}
                        placeholder="SELECT ..."
                        className="font-mono text-xs resize-none"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            form={formId}
            htmlType="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save changes' : 'Create rule'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
