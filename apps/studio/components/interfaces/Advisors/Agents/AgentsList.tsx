import { useParams } from 'common'
import {
  useAdvisorAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  useAdvisorAgentTasksQuery,
} from 'data/advisors/agents-query'
import type { AdvisorAgent } from 'data/advisors/types'
import { Bot, Edit, MoreVertical, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
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
  Form_Shadcn_,
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
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const AgentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  summary: z.string().optional(),
  system_prompt: z.string().optional(),
  tools: z.string().optional(),
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
          <Card className="flex flex-col items-center justify-center py-12">
            <Bot className="h-8 w-8 mb-2 text-foreground-lighter" />
            <p className="text-sm text-foreground">No agents configured</p>
            <p className="text-sm text-foreground-lighter mt-1">
              Create AI agents to analyze issues and suggest fixes.
            </p>
            <Button
              className="mt-4"
              icon={<Plus />}
              onClick={() => {
                setEditingAgent(null)
                setShowSheet(true)
              }}
            >
              Create Agent
            </Button>
          </Card>
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
                            agent.tools.slice(0, 3).map((tool) => (
                              <Badge key={tool} variant="default">
                                {tool}
                              </Badge>
                            ))
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
    defaultValues: { name: '', summary: '', system_prompt: '', tools: '' },
  })

  const handleOpen = () => {
    if (agent) {
      form.reset({
        name: agent.name,
        summary: agent.summary ?? '',
        system_prompt: agent.system_prompt ?? '',
        tools: agent.tools.join(', '),
      })
    } else {
      form.reset()
    }
  }

  const onSubmit = async (values: z.infer<typeof AgentFormSchema>) => {
    const toolsArray = (values.tools ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload = {
      name: values.name,
      summary: values.summary,
      system_prompt: values.system_prompt,
      tools: toolsArray,
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
                    description="Comma-separated list of available MCP tools"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="listAlerts, getAlert, commentOnAlert" />
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
            {isEditing ? 'Save changes' : 'Create agent'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
