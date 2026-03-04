import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import {
  useAdvisorAgentsQuery,
  useAdvisorAgentTasksQuery,
  useCreateAgentMutation,
  useDeleteAgentMutation,
  useUpdateAgentMutation,
} from 'data/advisors/agents-query'
import type { AdvisorAgent } from 'data/advisors/types'
import { Bot, Edit, Info, MoreVertical, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { AgentPresetsCards } from './AgentPresets'
import { TOOL_CATALOG, TOOL_NAMES } from './tool-catalog'

const AgentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  summary: z.string().optional(),
  system_prompt: z.string().optional(),
  tools: z.array(z.string()),
})

export function AgentsList() {
  const { ref: projectRef } = useParams()
  const { data: agents, isLoading } = useAdvisorAgentsQuery(projectRef)
  const { data: tasks } = useAdvisorAgentTasksQuery(projectRef)
  const [showSheet, setShowSheet] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AdvisorAgent | null>(null)
  const [deletingAgent, setDeletingAgent] = useState<AdvisorAgent | null>(null)

  const deleteMutation = useDeleteAgentMutation(projectRef)

  if (isLoading) return <GenericSkeletonLoader />

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Button
            icon={<Plus />}
            onClick={() => {
              setEditingAgent(null)
              setShowSheet(true)
            }}
          >
            New Agent
          </Button>
        </div>

        {(agents ?? []).length === 0 ? (
          <div className="space-y-6">
            <AgentPresetsCards />
            <Card className="flex flex-col items-center justify-center py-8">
              <Bot className="h-6 w-6 mb-2 text-foreground-lighter" />
              <p className="text-sm text-foreground-lighter">
                Or create a custom agent from scratch.
              </p>
              <Button
                className="mt-4"
                icon={<Plus />}
                onClick={() => {
                  setEditingAgent(null)
                  setShowSheet(true)
                }}
              >
                Create Custom Agent
              </Button>
            </Card>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(agents ?? []).map((agent) => {
                  const agentTasks = (tasks ?? []).filter((t) => t.agent_id === agent.id)
                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-foreground-lighter shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm text-foreground">{agent.name}</span>
                            {agent.summary && (
                              <p className="text-xs text-foreground-lighter truncate max-w-xs">
                                {agent.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {agent.tools.length > 0 ? (
                            <TooltipProvider>
                              {agent.tools.slice(0, 3).map((tool) => {
                                const def = TOOL_CATALOG.find((t) => t.name === tool)
                                return (
                                  <Tooltip key={tool}>
                                    <TooltipTrigger asChild>
                                      <Badge variant="default">{tool}</Badge>
                                    </TooltipTrigger>
                                    {def && <TooltipContent>{def.description}</TooltipContent>}
                                  </Tooltip>
                                )
                              })}
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-foreground-muted">None</span>
                          )}
                          {agent.tools.length > 3 && (
                            <Badge variant="default">+{agent.tools.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground-lighter">
                          {agentTasks.length} task{agentTasks.length !== 1 ? 's' : ''}
                        </span>
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
                                setEditingAgent(agent)
                                setShowSheet(true)
                              }}
                            >
                              <Edit size={12} />
                              <p>Edit agent</p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="space-x-2"
                              onClick={() => setDeletingAgent(agent)}
                            >
                              <Trash size={12} />
                              <p>Delete agent</p>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <AgentEditorSheet
        visible={showSheet}
        agent={editingAgent}
        projectRef={projectRef!}
        onClose={() => {
          setShowSheet(false)
          setEditingAgent(null)
        }}
      />

      <ConfirmationModal
        variant="destructive"
        visible={!!deletingAgent}
        title={`Delete agent "${deletingAgent?.name}"`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingAgent(null)}
        onConfirm={() => {
          if (!deletingAgent) return
          deleteMutation.mutate(deletingAgent.id, {
            onSuccess: () => {
              toast.success('Agent deleted')
              setDeletingAgent(null)
            },
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete this agent? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

function AgentEditorSheet({
  visible,
  agent,
  projectRef,
  onClose,
}: {
  visible: boolean
  agent: AdvisorAgent | null
  projectRef: string
  onClose: () => void
}) {
  const createMutation = useCreateAgentMutation(projectRef)
  const updateMutation = useUpdateAgentMutation(projectRef)
  const isEditing = !!agent
  const formId = 'agent-editor-form'

  const form = useForm<z.infer<typeof AgentFormSchema>>({
    resolver: zodResolver(AgentFormSchema),
    defaultValues: { name: '', summary: '', system_prompt: '', tools: [] },
  })

  const handleOpen = () => {
    if (agent) {
      form.reset({
        name: agent.name,
        summary: agent.summary ?? '',
        system_prompt: agent.system_prompt ?? '',
        tools: agent.tools ?? [],
      })
    } else {
      form.reset()
    }
  }

  const onSubmit = async (values: z.infer<typeof AgentFormSchema>) => {
    const payload = {
      name: values.name,
      summary: values.summary,
      system_prompt: values.system_prompt,
      tools: values.tools,
    }

    if (isEditing && agent) {
      await updateMutation.mutateAsync({ agentId: agent.id, ...payload })
      toast.success('Agent updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Agent created')
    }
    onClose()
  }

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="default" className="flex flex-col gap-0" onOpenAutoFocus={handleOpen}>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Agent' : 'Create Agent'}</SheetTitle>
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
                  <FormItemLayout layout="horizontal" label="Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Security Advisor" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="summary"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Summary">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Brief description" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="system_prompt"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="System Prompt">
                    <FormControl_Shadcn_>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder="You are a Supabase advisor..."
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
                name="tools"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Tools"
                    description="MCP tools this agent can use"
                  >
                    <div className="space-y-3 w-full">
                      <MultiSelector
                        onValuesChange={field.onChange}
                        values={field.value}
                        size="small"
                      >
                        <MultiSelectorTrigger
                          mode="inline-combobox"
                          label="Select tools..."
                          badgeLimit="wrap"
                          showIcon={false}
                          deletableBadge
                        />
                        <MultiSelectorContent>
                          <MultiSelectorList>
                            {TOOL_CATALOG.map((tool) => (
                              <MultiSelectorItem key={tool.name} value={tool.name}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">{tool.name}</span>
                                  <span className="text-foreground-lighter text-xs">
                                    — {tool.description}
                                  </span>
                                </div>
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>

                      {field.value.length > 0 && (
                        <div className="rounded border border-default p-3 space-y-2">
                          <p className="text-xs font-medium text-foreground-lighter">
                            Selected tools ({field.value.length})
                          </p>
                          {field.value.map((toolName: string) => {
                            const def = TOOL_CATALOG.find((t) => t.name === toolName)
                            return (
                              <div key={toolName} className="flex items-start gap-2">
                                <Info className="h-3 w-3 mt-0.5 text-foreground-muted shrink-0" />
                                <div>
                                  <span className="font-mono text-xs text-foreground">
                                    {toolName}
                                  </span>
                                  {def && (
                                    <p className="text-xs text-foreground-lighter">
                                      {def.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
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
            {isEditing ? 'Save changes' : 'Create agent'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
