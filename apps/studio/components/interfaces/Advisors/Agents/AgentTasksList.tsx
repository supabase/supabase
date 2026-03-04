import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAdvisorAgentTasksQuery,
  useCreateAgentTaskMutation,
  useDeleteAgentTaskMutation,
  useExecuteAgentTaskMutation,
  useTaskConversationsQuery,
  useUpdateAgentTaskMutation,
} from 'data/advisors/agents-query'
import type { AdvisorAgentTask } from 'data/advisors/types'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  MoreVertical,
  Play,
  Plus,
  Trash,
  Edit,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
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
  Switch,
  Textarea,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

const TaskFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  schedule: z.string().min(1, 'Schedule (cron) is required'),
  is_unique: z.boolean(),
  enabled: z.boolean(),
})

interface AgentTasksListProps {
  agentId: string
  projectRef: string
}

export function AgentTasksList({ agentId, projectRef }: AgentTasksListProps) {
  const { data: allTasks } = useAdvisorAgentTasksQuery(projectRef)
  const tasks = (allTasks ?? []).filter((t) => t.agent_id === agentId)

  const [showSheet, setShowSheet] = useState(false)
  const [editingTask, setEditingTask] = useState<AdvisorAgentTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<AdvisorAgentTask | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const updateMutation = useUpdateAgentTaskMutation(projectRef)
  const deleteMutation = useDeleteAgentTaskMutation(projectRef)
  const executeMutation = useExecuteAgentTaskMutation(projectRef)

  return (
    <div className="bg-surface-100 border-t border-default px-6 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground-lighter uppercase tracking-wide">
          Scheduled Tasks
        </p>
        <Button
          type="default"
          size="tiny"
          icon={<Plus size={12} />}
          onClick={() => {
            setEditingTask(null)
            setShowSheet(true)
          }}
        >
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-foreground-muted py-2">
          No scheduled tasks yet. Add a task to automate this agent on a cron schedule.
        </p>
      ) : (
        <div className="rounded border border-default divide-y divide-default bg-surface-200">
          {tasks.map((task) => (
            <div key={task.id}>
              <div className="flex items-center gap-3 px-3 py-2">
                <button
                  type="button"
                  className="shrink-0 text-foreground-lighter hover:text-foreground transition-colors"
                  onClick={() =>
                    setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                  }
                >
                  {expandedTaskId === task.id ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground">{task.name}</span>
                  {task.description && (
                    <p className="text-xs text-foreground-lighter truncate max-w-md">
                      {task.description}
                    </p>
                  )}
                </div>
                <Badge variant="default" className="font-mono text-xs shrink-0">
                  <Calendar size={10} className="mr-1" />
                  {task.schedule}
                </Badge>
                <Switch
                  checked={task.enabled}
                  onCheckedChange={(checked) =>
                    updateMutation.mutate(
                      { taskId: task.id, enabled: checked },
                      {
                        onSuccess: () =>
                          toast.success(
                            `Task ${checked ? 'enabled' : 'disabled'}`
                          ),
                      }
                    )
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="text" className="px-1" icon={<MoreVertical size={14} />} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-44">
                    <DropdownMenuItem
                      className="space-x-2"
                      onClick={() => {
                        setEditingTask(task)
                        setShowSheet(true)
                      }}
                    >
                      <Edit size={12} />
                      <span>Edit task</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="space-x-2"
                      onClick={() =>
                        executeMutation.mutate(task.id, {
                          onSuccess: () =>
                            toast.success(
                              'Task triggered — check run history for results'
                            ),
                          onError: () => toast.error('Failed to execute task'),
                        })
                      }
                    >
                      <Play size={12} />
                      <span>Run now</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="space-x-2"
                      onClick={() => setDeletingTask(task)}
                    >
                      <Trash size={12} />
                      <span>Delete task</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {expandedTaskId === task.id && (
                <TaskRunHistory projectRef={projectRef} taskId={task.id} />
              )}
            </div>
          ))}
        </div>
      )}

      <TaskEditorSheet
        visible={showSheet}
        task={editingTask}
        agentId={agentId}
        projectRef={projectRef}
        onClose={() => {
          setShowSheet(false)
          setEditingTask(null)
        }}
      />

      <ConfirmationModal
        variant="destructive"
        visible={!!deletingTask}
        title={`Delete task "${deletingTask?.name}"`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingTask(null)}
        onConfirm={() => {
          if (!deletingTask) return
          deleteMutation.mutate(deletingTask.id, {
            onSuccess: () => {
              toast.success('Task deleted')
              setDeletingTask(null)
            },
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete this task? Any scheduled cron job will also be removed.
        </p>
      </ConfirmationModal>
    </div>
  )
}

function TaskRunHistory({ projectRef, taskId }: { projectRef: string; taskId: string }) {
  const { data: conversations, isLoading } = useTaskConversationsQuery(projectRef, taskId)

  if (isLoading) {
    return (
      <div className="px-6 py-3 border-t border-default">
        <p className="text-xs text-foreground-muted animate-pulse">Loading run history…</p>
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="px-6 py-3 border-t border-default">
        <p className="text-xs text-foreground-muted">
          No runs yet. This task will produce results on its next scheduled run or when triggered
          manually.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-default">
      <div className="px-6 py-2">
        <p className="text-xs font-medium text-foreground-lighter uppercase tracking-wide mb-2">
          Run History
        </p>
        <div className="space-y-1">
          {conversations.map((conv) => {
            const messageCount = (conv as unknown as { message_count?: number }).message_count ?? 0
            return (
              <div
                key={conv.id}
                className="flex items-center gap-3 py-1.5 text-xs"
              >
                <Clock size={12} className="text-foreground-muted shrink-0" />
                <span className="text-foreground-lighter">
                  {new Date(conv.updated_at).toLocaleString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </Badge>
                {conv.title && (
                  <span className="text-foreground-lighter truncate max-w-xs">{conv.title}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TaskEditorSheet({
  visible,
  task,
  agentId,
  projectRef,
  onClose,
}: {
  visible: boolean
  task: AdvisorAgentTask | null
  agentId: string
  projectRef: string
  onClose: () => void
}) {
  const createMutation = useCreateAgentTaskMutation(projectRef)
  const updateMutation = useUpdateAgentTaskMutation(projectRef)
  const isEditing = !!task
  const formId = 'task-editor-form'

  const form = useForm<z.infer<typeof TaskFormSchema>>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      name: '',
      description: '',
      schedule: '0 8 * * *',
      is_unique: false,
      enabled: true,
    },
  })

  const handleOpen = () => {
    if (task) {
      form.reset({
        name: task.name,
        description: task.description ?? '',
        schedule: task.schedule,
        is_unique: task.is_unique,
        enabled: task.enabled,
      })
    } else {
      form.reset()
    }
  }

  const onSubmit = async (values: z.infer<typeof TaskFormSchema>) => {
    const payload = {
      agent_id: agentId,
      name: values.name,
      description: values.description,
      schedule: values.schedule,
      is_unique: values.is_unique,
      enabled: values.enabled,
    }

    if (isEditing && task) {
      await updateMutation.mutateAsync({ taskId: task.id, ...payload })
      toast.success('Task updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Task created')
    }
    onClose()
  }

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="default" className="flex flex-col gap-0" onOpenAutoFocus={handleOpen}>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Task' : 'Add Task'}</SheetTitle>
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
                      <Input_Shadcn_ {...field} placeholder="Daily Security Review" />
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
                        rows={3}
                        placeholder="What this task should do…"
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
                name="schedule"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Schedule (cron)"
                    description="Standard cron expression, e.g. 0 8 * * * for daily at 8 AM"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="0 8 * * *" className="font-mono" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="is_unique"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Unique"
                    description="When enabled, only one conversation per task is maintained (overwrites previous runs)"
                  >
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                name="enabled"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Enabled"
                    description="When disabled, the cron job will not run"
                  >
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
            {isEditing ? 'Save changes' : 'Add task'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
