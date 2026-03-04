import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import {
  useAdvisorChannelsQuery,
  useCreateChannelMutation,
  useDeleteChannelMutation,
  useUpdateChannelMutation,
} from 'data/advisors/channels-query'
import type { AdvisorChannel } from 'data/advisors/types'
import { Bell, Edit, ExternalLink, Globe, Mail, MessageSquare, MoreVertical, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

const channelTypeConfig: Record<string, { icon: typeof Mail; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  slack: { icon: MessageSquare, label: 'Slack' },
  webhook: { icon: Globe, label: 'Webhook' },
  push: { icon: Bell, label: 'Push' },
}

const ChannelFormSchema = z.object({
  type: z.enum(['email', 'slack', 'webhook', 'push']),
  name: z.string().min(1, 'Name is required'),
  config: z.record(z.string()),
  severity_filter: z.array(z.string()).min(1, 'At least one severity is required'),
  category_filter: z.array(z.string()).nullable(),
  is_enabled: z.boolean(),
})

export function ChannelsList() {
  const { ref: projectRef } = useParams()
  const { data: channels, isLoading } = useAdvisorChannelsQuery(projectRef)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingChannel, setEditingChannel] = useState<AdvisorChannel | null>(null)
  const [deletingChannel, setDeletingChannel] = useState<AdvisorChannel | null>(null)

  const updateMutation = useUpdateChannelMutation(projectRef)
  const deleteMutation = useDeleteChannelMutation(projectRef)

  if (isLoading) return <GenericSkeletonLoader />

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Button icon={<Plus />} onClick={() => setShowCreateDialog(true)}>
            Add Channel
          </Button>
        </div>

        {(channels ?? []).length === 0 ? (
          <div className="flex flex-col gap-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ChannelTypeCard
                icon={<MessageSquare className="h-5 w-5 text-foreground-lighter" />}
                title="Slack"
                description="Get alerted in your team's Slack channel when issues are detected."
                featured
                onSetup={() => setShowCreateDialog(true)}
              />
              <ChannelTypeCard
                icon={<Mail className="h-5 w-5 text-foreground-lighter" />}
                title="Email"
                description="Receive email notifications for critical and warning issues."
                onSetup={() => setShowCreateDialog(true)}
              />
              <ChannelTypeCard
                icon={<Globe className="h-5 w-5 text-foreground-lighter" />}
                title="Webhook"
                description="Send alerts to any HTTP endpoint for custom integrations."
                onSetup={() => setShowCreateDialog(true)}
              />
            </div>

            <SlackMessagePreview />
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity Filter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(channels ?? []).map((channel) => {
                  const config = channelTypeConfig[channel.type] ?? channelTypeConfig.webhook
                  const Icon = config.icon
                  return (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-foreground-lighter" />
                          <span className="text-foreground text-sm">{channel.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-foreground-lighter">
                        {config.label}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {channel.severity_filter.map((sev) => (
                            <Badge
                              key={sev}
                              variant={
                                sev === 'critical'
                                  ? 'destructive'
                                  : sev === 'warning'
                                    ? 'warning'
                                    : 'default'
                              }
                            >
                              {sev}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={channel.is_enabled}
                          onCheckedChange={(checked) =>
                            updateMutation.mutate(
                              { channelId: channel.id, is_enabled: checked },
                              {
                                onSuccess: () =>
                                  toast.success(`Channel ${checked ? 'enabled' : 'disabled'}`),
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
                              onClick={() => setEditingChannel(channel)}
                            >
                              <Edit size={12} />
                              <p>Edit channel</p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="space-x-2"
                              onClick={() => setDeletingChannel(channel)}
                            >
                              <Trash size={12} />
                              <p>Delete channel</p>
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

      <ChannelFormDialog
        visible={showCreateDialog || !!editingChannel}
        channel={editingChannel}
        projectRef={projectRef!}
        onClose={() => {
          setShowCreateDialog(false)
          setEditingChannel(null)
        }}
      />

      <ConfirmationModal
        variant="destructive"
        visible={!!deletingChannel}
        title={`Delete channel "${deletingChannel?.name}"`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingChannel(null)}
        onConfirm={() => {
          if (!deletingChannel) return
          deleteMutation.mutate(deletingChannel.id, {
            onSuccess: () => {
              toast.success('Channel deleted')
              setDeletingChannel(null)
            },
          })
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete this notification channel? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

function ChannelFormDialog({
  visible,
  channel,
  projectRef,
  onClose,
}: {
  visible: boolean
  channel: AdvisorChannel | null
  projectRef: string
  onClose: () => void
}) {
  const createMutation = useCreateChannelMutation(projectRef)
  const updateMutation = useUpdateChannelMutation(projectRef)
  const isEditing = !!channel

  const form = useForm<z.infer<typeof ChannelFormSchema>>({
    resolver: zodResolver(ChannelFormSchema),
    defaultValues: {
      type: 'email',
      name: '',
      config: {},
      severity_filter: ['critical', 'warning'],
      category_filter: null,
      is_enabled: true,
    },
  })

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  const handleOpen = () => {
    if (channel) {
      form.reset({
        type: channel.type,
        name: channel.name,
        config: channel.config as Record<string, string>,
        severity_filter: channel.severity_filter,
        category_filter: channel.category_filter,
        is_enabled: channel.is_enabled,
      })
    } else {
      form.reset({
        type: 'email',
        name: '',
        config: {},
        severity_filter: ['critical', 'warning'],
        category_filter: null,
        is_enabled: true,
      })
    }
  }

  const onSubmit = async (values: z.infer<typeof ChannelFormSchema>) => {
    if (isEditing && channel) {
      await updateMutation.mutateAsync({ channelId: channel.id, ...values })
      toast.success('Channel updated')
    } else {
      await createMutation.mutateAsync(values)
      toast.success('Channel created')
    }
    onClose()
  }

  const watchType = form.watch('type')

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogContent size="small" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit channel' : 'Add notification channel'}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form
            id="channel-form"
            className="flex flex-col gap-y-4 p-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>Channel type</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Select_Shadcn_
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEditing}
                    >
                      <SelectTrigger_Shadcn_>
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="email">Email</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="slack">Slack</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="webhook">Webhook</SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="e.g., Team Alerts" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            {watchType === 'email' && (
              <FormField_Shadcn_
                name="config.email"
                control={form.control}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-col gap-1">
                    <FormLabel_Shadcn_>Email address</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} type="email" placeholder="team@example.com" />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
            )}

            {watchType === 'slack' && (
              <>
                <FormField_Shadcn_
                  name="config.webhook_url"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="flex flex-col gap-1">
                      <FormLabel_Shadcn_>Webhook URL</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </FormControl_Shadcn_>
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  name="config.channel"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="flex flex-col gap-1">
                      <FormLabel_Shadcn_>Channel</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} placeholder="#alerts" />
                      </FormControl_Shadcn_>
                    </FormItem_Shadcn_>
                  )}
                />
              </>
            )}

            {watchType === 'webhook' && (
              <FormField_Shadcn_
                name="config.url"
                control={form.control}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-col gap-1">
                    <FormLabel_Shadcn_>Webhook URL</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="https://example.com/webhook" />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
            )}

            <FormField_Shadcn_
              name="severity_filter"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>Severity filter</FormLabel_Shadcn_>
                  <div className="flex gap-4">
                    {(['critical', 'warning', 'info'] as const).map((sev) => (
                      <label key={sev} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox_Shadcn_
                          checked={field.value.includes(sev)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, sev]
                                : field.value.filter((s: string) => s !== sev)
                            )
                          }}
                        />
                        <span className="capitalize text-foreground-light">{sev}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              block
              size="small"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Save changes' : 'Add channel'}
            </Button>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

function ChannelTypeCard({
  icon,
  title,
  description,
  featured,
  onSetup,
}: {
  icon: React.ReactNode
  title: string
  description: string
  featured?: boolean
  onSetup: () => void
}) {
  return (
    <Card className={`flex flex-col ${featured ? 'border-brand-500/50' : ''}`}>
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 shrink-0 ${featured ? 'bg-brand-200/20' : 'bg-surface-200'}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {featured && <Badge variant="default">Recommended</Badge>}
            </div>
            <p className="text-xs text-foreground-lighter mt-0.5">{description}</p>
          </div>
        </div>
        <div className="mt-auto pt-2">
          <Button type={featured ? 'primary' : 'default'} size="tiny" icon={<Plus className="h-3 w-3" />} onClick={onSetup}>
            Set up {title}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function SlackMessagePreview() {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-foreground-lighter">Slack Message Preview</p>
          <a
            href="https://api.slack.com/messaging/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground-lighter hover:text-foreground inline-flex items-center gap-1"
          >
            Slack webhook docs <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="rounded-lg border border-default bg-surface-100 p-4 font-sans text-sm">
          <div className="flex items-start gap-3">
            <div className="rounded bg-brand-400 p-1 shrink-0">
              <Bell className="h-3 w-3 text-white" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Supabase Advisors
              </p>
              <p className="text-foreground-lighter leading-relaxed">
                <span className="font-medium text-destructive-600">CRITICAL</span>{' '}
                <span className="font-medium">Table &ldquo;users&rdquo; has no RLS enabled</span>
              </p>
              <p className="text-xs text-foreground-muted">
                Row Level Security is not enabled on the &ldquo;users&rdquo; table, exposing all rows via the API.
              </p>
              <div className="flex gap-2 pt-1">
                <span className="text-xs text-brand font-medium cursor-pointer hover:underline">View in Dashboard</span>
                <span className="text-xs text-foreground-muted">&middot;</span>
                <span className="text-xs text-foreground-lighter">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
