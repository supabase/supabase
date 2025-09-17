import { MousePointer2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Entity } from 'data/table-editor/table-editor-types'
import { useAppStateSnapshot } from 'state/app-state'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useRealtimeStatus } from 'hooks/misc/useRealtimeStatus'
import { useParams } from 'common'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  generateSmartPolicyTemplates,
  analyzeTableStructure,
} from '../Auth/Policies/PolicyEditorModal/SmartPolicyTemplates'
import {
  Button,
  Checkbox_Shadcn_ as Checkbox,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  FormItem_Shadcn_ as FormItem,
  FormLabel_Shadcn_ as FormLabel,
  FormMessage_Shadcn_ as FormMessage,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  TextArea_Shadcn_ as Textarea,
} from 'ui'
import { ArrowUp, ArrowDown, GripVertical, Play, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useCopyToClipboard } from 'hooks/ui/useCopyToClipboard'

interface RealtimeSettingsSheetProps {
  table: Entity
}

const realtimeFormSchema = z.object({
  channelName: z
    .string()
    .min(1, 'Channel name is required')
    .regex(
      /^[a-zA-Z0-9\-_{}]+$/,
      'Channel name can only contain letters, numbers, hyphens, underscores, and curly braces for column interpolation'
    ),
  useCompositeTopicName: z.boolean().default(false),
  selectedColumns: z.array(z.string()).default([]),
  authorizationStrategy: z
    .enum(['all_authenticated', 'topic_based', 'custom'])
    .default('all_authenticated'),
  realtimeFeatures: z
    .array(z.enum(['broadcast', 'presence']))
    .min(1, 'At least one realtime feature must be selected')
    .default(['broadcast']),
  jwtClaimsForTopicAuth: z.array(z.string()).default(['user_id']),
  customJwtClaims: z.array(z.string()).default([]),
  topicSegmentMappings: z
    .array(
      z.object({
        type: z.enum(['jwt', 'sql']).default('jwt'),
        jwtClaim: z.string().default('user_id'),
        sqlQuery: z.string().default(''),
      })
    )
    .default([]),
  customCondition: z.string().optional(),
  // Write permissions
  enableWritePermissions: z.boolean().default(false),
  writeAuthorizationStrategy: z
    .enum(['all_authenticated', 'topic_based', 'custom'])
    .default('all_authenticated'),
  writeCustomCondition: z.string().optional(),
  writeTopicSegmentMappings: z
    .array(
      z.object({
        type: z.enum(['jwt', 'sql']).default('jwt'),
        jwtClaim: z.string().default('user_id'),
        sqlQuery: z.string().default(''),
      })
    )
    .default([]),
})

export const RealtimeSettingsSheet = ({ table }: RealtimeSettingsSheetProps) => {
  const { showRealtimeSettingsSheet, setShowRealtimeSettingsSheet } = useAppStateSnapshot()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const { copy } = useCopyToClipboard()

  // SQL execution setup
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { mutate: executeSql, isLoading: isExecutingSql } = useExecuteSqlMutation({
    onSuccess: () => {
      toast.success('SQL executed successfully')
    },
    onError: (error: any) => {
      toast.error(`SQL execution failed: ${error.message}`)
    },
  })

  // Check existing realtime status
  const { isRealtimeEnabled, hasTriggerRealtime, realtimeTriggers, realtimeType } =
    useRealtimeStatus(table)

  const form = useForm<z.infer<typeof realtimeFormSchema>>({
    resolver: zodResolver(realtimeFormSchema),
    defaultValues: {
      channelName: table.name,
      useCompositeTopicName: false,
      selectedColumns: [],
      authorizationStrategy: 'all_authenticated',
      realtimeFeatures: ['broadcast'],
      jwtClaimsForTopicAuth: ['user_id'],
      customJwtClaims: [],
      topicSegmentMappings: [],
      enableWritePermissions: false,
      writeAuthorizationStrategy: 'all_authenticated',
      writeCustomCondition: '',
      writeTopicSegmentMappings: [],
    },
  })

  const generateTopicExpression = (values: z.infer<typeof realtimeFormSchema>) => {
    if (!values.useCompositeTopicName || values.selectedColumns.length === 0) {
      return `'${values.channelName}'`
    }

    const columnExpressions = values.selectedColumns
      .map((col) => `COALESCE(NEW.${col}::text, OLD.${col}::text, 'null')`)
      .join(` || ':' || `)
    return `'${values.channelName}:' || ${columnExpressions}`
  }

  const generateTriggerFunctionSQL = (values: z.infer<typeof realtimeFormSchema>) => {
    const topicExpression = generateTopicExpression(values)
    const isComposite = values.useCompositeTopicName && values.selectedColumns.length > 0

    return `CREATE OR REPLACE FUNCTION public.${table.name}_changes()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    topic_name TEXT;
BEGIN
    -- Build the topic name${isComposite ? ' dynamically' : ''}
    topic_name := ${topicExpression};

    -- Broadcast the change
    PERFORM realtime.broadcast_changes(
        topic_name,                -- topic
        TG_OP,                     -- event
        TG_OP,                     -- operation
        TG_TABLE_NAME,             -- table
        TG_TABLE_SCHEMA,           -- schema
        NEW,                       -- new record
        OLD                        -- old record
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;`
  }

  const generateCreateTriggerSQL = (values: z.infer<typeof realtimeFormSchema>) => {
    return `CREATE OR REPLACE TRIGGER ${table.name}_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.${table.name}
    FOR EACH ROW EXECUTE FUNCTION public.${table.name}_changes();`
  }

  const generateRLSPolicySQL = (
    values: z.infer<typeof realtimeFormSchema>,
    policyType: 'read' | 'write' = 'read'
  ) => {
    if (values.realtimeFeatures.length === 0) return ''

    const isWritePolicy = policyType === 'write'
    const strategy = isWritePolicy
      ? values.writeAuthorizationStrategy
      : values.authorizationStrategy
    const customCondition = isWritePolicy ? values.writeCustomCondition : values.customCondition
    const topicMappings = isWritePolicy
      ? values.writeTopicSegmentMappings
      : values.topicSegmentMappings

    let baseCondition = ''
    let policyName = `${policyType} access for ${table.name}`

    switch (strategy) {
      case 'all_authenticated':
        baseCondition = 'true'
        policyName = `${values.realtimeFeatures.join('+')} ${policyType} access for ${table.name}`
        break

      case 'topic_based':
        if (values.useCompositeTopicName && values.selectedColumns.length > 0) {
          // Generate topic parsing logic for composite topics with mixed JWT/SQL mapping
          const topicChecks = values.selectedColumns
            .map((col, index) => {
              const mapping = topicMappings[index] || {
                type: 'jwt',
                jwtClaim: 'user_id',
                sqlQuery: '',
              }
              const topicSegment = `split_part(realtime.messages.topic, ':', ${index + 2})`

              if (mapping.type === 'sql' && mapping.sqlQuery) {
                // Use SQL query - user can write something like: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
                return `(${topicSegment} = 'true' AND (${mapping.sqlQuery}))`
              } else {
                // Use JWT claim mapping with auth helper functions
                const jwtClaim = mapping.jwtClaim || 'user_id'
                if (jwtClaim === 'user_id') {
                  return `${topicSegment} = auth.uid()::text`
                } else {
                  return `${topicSegment} = (auth.jwt() ->> '${jwtClaim}')`
                }
              }
            })
            .join(' AND ')

          baseCondition = `realtime.messages.topic LIKE '${values.channelName}:%' AND ${topicChecks}`
          policyName = `topic-based ${values.realtimeFeatures.join('+')} ${policyType} for ${table.name}`
        } else {
          // Simple topic check
          baseCondition = `realtime.messages.topic = '${values.channelName}'`
          policyName = `topic-based ${values.realtimeFeatures.join('+')} ${policyType} for ${table.name}`
        }
        break

      case 'custom':
        baseCondition = customCondition || 'true'
        policyName = `custom ${values.realtimeFeatures.join('+')} ${policyType} for ${table.name}`
        break
    }

    // Create extension list for IN clause
    const extensionList = values.realtimeFeatures.map((feature) => `'${feature}'`).join(', ')

    // For write policies, we need to handle INSERT operations differently
    const policyCommand = isWritePolicy ? 'INSERT' : 'SELECT'
    const policyClause = isWritePolicy ? 'WITH CHECK' : 'USING'

    return `CREATE POLICY "${policyName.replace(/\s+/g, '_').toLowerCase()}"
ON "realtime"."messages"
FOR ${policyCommand}
TO authenticated
${policyClause} (
    realtime.messages.extension IN (${extensionList}) AND ${baseCondition}
);`
  }

  // Generate smart RLS templates based on table structure
  const generateSmartRLSTemplates = () => {
    const tableColumns = table.columns.map((col) => ({
      name: col.name,
      data_type: col.data_type,
      is_nullable: !col.is_nullable,
      is_identity: col.is_identity,
      is_generated: col.is_generated,
    }))

    return generateSmartPolicyTemplates('public', table.name, tableColumns)
  }

  const smartTemplates = generateSmartRLSTemplates()

  const generateClientCode = (values: z.infer<typeof realtimeFormSchema>) => {
    if (values.useCompositeTopicName && values.selectedColumns.length > 0) {
      // Generate dynamic client code for composite topics
      const columnParams = values.selectedColumns.join(', ')
      const topicTemplate = `${values.channelName}:${values.selectedColumns.map((col) => `\${${col}}`).join(':')}`

      return `// Dynamic topic subscription with column values
// You need to provide the column values when subscribing
// Server-side RLS will validate access based on your JWT claims and topic segments
const subscribeToRecord = (${columnParams}) => {
  // Build the topic name dynamically
  const topicName = \`${topicTemplate}\`

  // Create the channel
  const channel = supabase.channel(topicName, {
    config: { private: true }
  })

  return channel
    .on('broadcast', { event: 'INSERT' }, (payload) => {
      console.log('New record for topic:', topicName, payload)
    })
    .on('broadcast', { event: 'UPDATE' }, (payload) => {
      console.log('Updated record for topic:', topicName, payload)
    })
    .on('broadcast', { event: 'DELETE' }, (payload) => {
      console.log('Deleted record for topic:', topicName, payload)
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to:', topicName)
      } else {
        console.error('Connection failed:', err)
      }
    })
}

// Usage examples:
// subscribeToRecord(${values.selectedColumns.map((col) => `'example_${col}_value'`).join(', ')})
// This creates topic: ${values.channelName}:${values.selectedColumns.map((col) => `example_${col}_value`).join(':')}

// For real usage, pass actual values from your data:
// const channel = subscribeToRecord(${values.selectedColumns.map((col) => `record.${col}`).join(', ')})`
    } else {
      // Simple static topic
      return `// Initialize channel with static topic name
const topicName = '${values.channelName}'

const channel = supabase.channel(topicName, {
  config: { private: true }
})

// Listen for database changes via broadcast
channel
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    console.log('New record:', payload)
  })
  .on('broadcast', { event: 'UPDATE' }, (payload) => {
    console.log('Updated record:', payload)
  })
  .on('broadcast', { event: 'DELETE' }, (payload) => {
    console.log('Deleted record:', payload)
  })
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to:', topicName)
    } else {
      console.error('Connection failed:', err)
    }
  })`
    }
  }

  const handleConfirmAndExecute = async () => {
    const values = form.getValues()

    if (!project?.connectionString) {
      toast.error('Project connection string is missing')
      return
    }

    try {
      // Create trigger function first
      const triggerFunctionSQL = generateTriggerFunctionSQL(values)
      if (triggerFunctionSQL) {
        executeSql({
          projectRef: projectRef!,
          connectionString: project.connectionString,
          sql: triggerFunctionSQL,
          isRoleImpersonationEnabled: false, // Run as postgres role for admin operations
          isStatementTimeoutDisabled: true,
          contextualInvalidation: true,
        })
      }

      // Create trigger
      const createTriggerSQL = generateCreateTriggerSQL(values)
      if (createTriggerSQL) {
        executeSql({
          projectRef: projectRef!,
          connectionString: project.connectionString,
          sql: createTriggerSQL,
          isRoleImpersonationEnabled: false, // Run as postgres role for admin operations
          isStatementTimeoutDisabled: true,
          contextualInvalidation: true,
        })
      }

      // Create read policy
      const readPolicySQL = generateRLSPolicySQL(values, 'read')
      if (readPolicySQL) {
        executeSql({
          projectRef: projectRef!,
          connectionString: project.connectionString,
          sql: readPolicySQL,
          isRoleImpersonationEnabled: false, // Run as postgres role for admin operations
          isStatementTimeoutDisabled: true,
          contextualInvalidation: true,
        })
      }

      // Create write policy if enabled
      if (values.enableWritePermissions) {
        const writePolicySQL = generateRLSPolicySQL(values, 'write')
        if (writePolicySQL) {
          executeSql({
            projectRef: projectRef!,
            connectionString: project.connectionString,
            sql: writePolicySQL,
            isRoleImpersonationEnabled: false, // Run as postgres role for admin operations
            isStatementTimeoutDisabled: true,
            contextualInvalidation: true,
          })
        }
      }

      toast.success('Realtime configuration completed successfully')
      setShowRealtimeSettingsSheet(false)
    } catch (error: any) {
      toast.error(`Failed to create realtime configuration: ${error.message}`)
    }
  }

  const handleCreateRLSPolicy = async () => {
    const values = form.getValues()

    if (!project?.connectionString) {
      toast.error('Project connection string is missing')
      return
    }

    try {
      // Create read policy
      const readPolicySQL = generateRLSPolicySQL(values, 'read')
      if (readPolicySQL) {
        executeSql({
          projectRef: projectRef!,
          connectionString: project.connectionString,
          sql: readPolicySQL,
          isRoleImpersonationEnabled: false, // Run as postgres role for admin operations
          isStatementTimeoutDisabled: true,
          contextualInvalidation: true,
        })
      }

      // Create write policy if enabled
      if (values.enableWritePermissions) {
        const writePolicySQL = generateRLSPolicySQL(values, 'write')
        if (writePolicySQL) {
          executeSql({
            projectRef: projectRef!,
            connectionString: project.connectionString,
            sql: writePolicySQL,
            isRoleImpersonationEnabled: false, // Run as postgres role for admin operations
            isStatementTimeoutDisabled: true,
            contextualInvalidation: true,
          })
        }
      }

      toast.success('RLS policies created successfully')
    } catch (error: any) {
      toast.error(`Failed to create RLS policies: ${error.message}`)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the container, not just moving to a child
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number, field: any) => {
    e.preventDefault()
    e.stopPropagation()

    const sourceIndex = draggedIndex
    if (sourceIndex === null || sourceIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const currentColumns = [...field.value]
    const draggedItem = currentColumns[sourceIndex]

    // Remove dragged item from source position
    currentColumns.splice(sourceIndex, 1)

    // Insert at new position
    currentColumns.splice(dropIndex, 0, draggedItem)

    field.onChange(currentColumns)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <Sheet open={showRealtimeSettingsSheet} onOpenChange={setShowRealtimeSettingsSheet}>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <MousePointer2 size={20} strokeWidth={1.5} />
            {isRealtimeEnabled ? 'Realtime Configuration' : 'Realtime Broadcast Setup'}
          </SheetTitle>
          <SheetDescription>
            {isRealtimeEnabled ? (
              <>
                Manage database triggers and RLS policies for realtime broadcasting on the{' '}
                <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded">{table.name}</code>{' '}
                table
                <span className="ml-2 text-xs text-brand">
                  •{' '}
                  {realtimeType === 'trigger'
                    ? `Has ${realtimeTriggers.length} realtime trigger${realtimeTriggers.length > 1 ? 's' : ''}`
                    : realtimeType === 'publication'
                      ? 'Enabled via publication'
                      : 'Enabled'}
                </span>
              </>
            ) : (
              <>
                Set up database triggers and RLS policies for realtime broadcasting on the{' '}
                <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded">{table.name}</code>{' '}
                table
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-0 px-6 py-6 overflow-auto">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-6">
                {/* Existing Realtime Status */}
                {isRealtimeEnabled && realtimeType === 'trigger' && (
                  <div className="space-y-3 p-4 bg-brand-50 border border-brand-200 rounded-md">
                    <h3 className="text-sm font-medium text-brand">Existing Realtime Triggers</h3>
                    <p className="text-xs text-brand-600">
                      This table already has {realtimeTriggers.length} realtime trigger
                      {realtimeTriggers.length > 1 ? 's' : ''} configured.
                    </p>
                    <div className="space-y-2">
                      {realtimeTriggers.map((trigger, index) => (
                        <div key={index} className="text-xs bg-surface-100 p-2 rounded border">
                          <div className="font-mono text-foreground">{trigger.trigger_name}</div>
                          <div className="text-foreground-light">
                            Function: {trigger.function_name}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-brand-600">
                      You can still configure additional triggers or modify RLS policies below.
                    </p>
                  </div>
                )}

                {/* Channel Configuration */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Channel Configuration</h3>
                  <FormField
                    control={form.control}
                    name="channelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel Name</FormLabel>
                        <FormControl>
                          <Input placeholder={`${table.name}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Composite Topic Name Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Composite Topic Names
                        </FormLabel>
                        <p className="text-sm text-foreground-light">
                          Include column values in the topic name for more granular subscriptions
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name="useCompositeTopicName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch('useCompositeTopicName') && (
                      <div className="space-y-4 pl-4 border-l-2 border-border">
                        <FormField
                          control={form.control}
                          name="selectedColumns"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Columns for Topic Name (Order Matters)</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  {/* Selected Columns (Ordered) */}
                                  {field.value.length > 0 && (
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium">
                                        Selected Columns (drag to reorder):
                                      </Label>
                                      <div className="space-y-1 border rounded-md p-2 bg-surface-50">
                                        {field.value.map((columnName: string, index: number) => {
                                          const column = table.columns.find(
                                            (c) => c.name === columnName
                                          )
                                          const isDragging = draggedIndex === index
                                          const isDragOver =
                                            dragOverIndex === index && draggedIndex !== index

                                          return (
                                            <div
                                              key={columnName}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, index)}
                                              onDragOver={(e) => handleDragOver(e, index)}
                                              onDragEnter={handleDragEnter}
                                              onDragLeave={handleDragLeave}
                                              onDrop={(e) => handleDrop(e, index, field)}
                                              onDragEnd={handleDragEnd}
                                              className={`flex items-center justify-between p-2 rounded border transition-all ${
                                                isDragging
                                                  ? 'bg-surface-200 opacity-50 scale-105 shadow-lg'
                                                  : isDragOver
                                                    ? 'bg-brand-200 border-brand-400'
                                                    : 'bg-surface-100 hover:bg-surface-200'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <GripVertical
                                                  className={`w-4 h-4 cursor-grab active:cursor-grabbing transition-colors ${
                                                    isDragging
                                                      ? 'text-brand'
                                                      : 'text-foreground-muted hover:text-foreground'
                                                  }`}
                                                />
                                                <span className="text-sm font-medium">
                                                  #{index + 1}
                                                </span>
                                                <code className="text-xs bg-surface-200 px-2 py-1 rounded">
                                                  {columnName}
                                                </code>
                                                <span className="text-foreground-light text-xs">
                                                  ({column?.data_type || 'unknown'})
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  type="text"
                                                  size="tiny"
                                                  className="h-6 w-6 p-0"
                                                  disabled={index === 0}
                                                  onClick={() => {
                                                    const newOrder = [...field.value]
                                                    const temp = newOrder[index]
                                                    newOrder[index] = newOrder[index - 1]
                                                    newOrder[index - 1] = temp
                                                    field.onChange(newOrder)
                                                  }}
                                                >
                                                  <ArrowUp className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  type="text"
                                                  size="tiny"
                                                  className="h-6 w-6 p-0"
                                                  disabled={index === field.value.length - 1}
                                                  onClick={() => {
                                                    const newOrder = [...field.value]
                                                    const temp = newOrder[index]
                                                    newOrder[index] = newOrder[index + 1]
                                                    newOrder[index + 1] = temp
                                                    field.onChange(newOrder)
                                                  }}
                                                >
                                                  <ArrowDown className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  type="text"
                                                  size="tiny"
                                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                  onClick={() => {
                                                    field.onChange(
                                                      field.value.filter(
                                                        (name: string) => name !== columnName
                                                      )
                                                    )
                                                  }}
                                                >
                                                  ×
                                                </Button>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Available Columns to Add */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium">
                                      Available Columns:
                                    </Label>
                                    <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                                      {table.columns
                                        .filter((column) => !field.value.includes(column.name))
                                        .map((column) => (
                                          <div
                                            key={column.name}
                                            className="flex items-center justify-between p-1 hover:bg-surface-100 rounded"
                                          >
                                            <div className="flex items-center gap-2">
                                              <code className="text-xs bg-surface-100 px-2 py-1 rounded">
                                                {column.name}
                                              </code>
                                              <span className="text-foreground-light text-xs">
                                                ({column.data_type})
                                              </span>
                                            </div>
                                            <Button
                                              type="text"
                                              size="tiny"
                                              className="h-6 px-2 text-xs"
                                              onClick={() => {
                                                field.onChange([...field.value, column.name])
                                              }}
                                            >
                                              Add
                                            </Button>
                                          </div>
                                        ))}
                                      {table.columns.filter(
                                        (column) => !field.value.includes(column.name)
                                      ).length === 0 && (
                                        <p className="text-xs text-foreground-light p-2">
                                          All columns added to topic
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </FormControl>
                              {field.value.length > 0 && (
                                <p className="text-xs text-foreground-light">
                                  Topic pattern: {form.watch('channelName')}:{field.value.join(':')}
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* RLS Policy Configuration - Always Required */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Row Level Security</h3>
                    <p className="text-sm text-foreground-light">
                      RLS policies are required for secure realtime channel access control
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Write Permissions Toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-md bg-surface-50">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Write Permissions</h4>
                        <p className="text-xs text-foreground-light">
                          Allow users to write messages to the realtime channel
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name="enableWritePermissions"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Realtime Feature Selection */}
                    <div className="space-y-3">
                      <p className="text-xs text-foreground-light">
                        Select which realtime features users can access through this policy
                      </p>
                      <FormField
                        control={form.control}
                        name="realtimeFeatures"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value.includes('broadcast')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, 'broadcast'])
                                    } else {
                                      field.onChange(
                                        field.value.filter((f: string) => f !== 'broadcast')
                                      )
                                    }
                                  }}
                                />
                                <Label className="text-sm">Broadcast</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value.includes('presence')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, 'presence'])
                                    } else {
                                      field.onChange(
                                        field.value.filter((f: string) => f !== 'presence')
                                      )
                                    }
                                  }}
                                />
                                <Label className="text-sm">Presence</Label>
                              </div>
                            </div>
                            <p className="text-xs text-foreground-light">
                              {field.value.length === 0 && 'At least one feature must be selected'}
                              {field.value.includes('broadcast') &&
                                field.value.includes('presence') &&
                                'Users can access both database changes and presence information'}
                              {field.value.includes('broadcast') &&
                                !field.value.includes('presence') &&
                                'Users can access database changes only'}
                              {!field.value.includes('broadcast') &&
                                field.value.includes('presence') &&
                                'Users can access presence information only'}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="authorizationStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Authorization Strategy</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select authorization strategy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all_authenticated">
                                  Allow all authenticated users
                                </SelectItem>
                                <SelectItem value="topic_based">
                                  Topic-based access control
                                </SelectItem>
                                <SelectItem value="custom">Custom condition</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <p className="text-xs text-foreground-light mt-1">
                            {form.watch('authorizationStrategy') === 'topic_based' &&
                              'Check if user has access based on topic structure'}
                            {form.watch('authorizationStrategy') === 'custom' &&
                              'Write custom SQL conditions for advanced use cases'}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('authorizationStrategy') === 'topic_based' && (
                      <div className="space-y-3">
                        <div className="text-sm text-foreground-light">
                          {form.watch('useCompositeTopicName')
                            ? 'Maps topic segments to JWT claims for authorization'
                            : 'Uses simple topic matching for authorization'}
                        </div>

                        {form.watch('useCompositeTopicName') &&
                          form.watch('selectedColumns').length > 0 && (
                            <div className="space-y-3">
                              <FormLabel className="text-xs">
                                Topic Segment Authorization Mapping
                              </FormLabel>
                              <p className="text-xs text-foreground-light">
                                Choose how each topic segment should be validated - either map to
                                JWT claims or use custom SQL queries
                              </p>
                              {form.watch('selectedColumns').map((col: string, index: number) => {
                                // Ensure mapping exists for this index
                                const currentMappings = form.getValues().topicSegmentMappings
                                if (!currentMappings[index]) {
                                  const updated = [...currentMappings]
                                  updated[index] = {
                                    type: 'jwt',
                                    jwtClaim: 'user_id',
                                    sqlQuery: '',
                                  }
                                  form.setValue('topicSegmentMappings', updated)
                                }

                                const mapping = form.watch(`topicSegmentMappings.${index}`) || {
                                  type: 'jwt',
                                  jwtClaim: 'user_id',
                                  sqlQuery: '',
                                }

                                return (
                                  <div key={col} className="space-y-2 p-3 border rounded-md">
                                    <div className="flex items-center gap-2 text-xs">
                                      <code className="bg-surface-100 px-2 py-1 rounded font-mono">
                                        {col}
                                      </code>
                                      <span className="text-foreground-light">→</span>
                                      <span className="text-foreground-light">
                                        topic segment {index + 1}
                                      </span>
                                    </div>

                                    {/* Type selector */}
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs">Validation Type:</Label>
                                      <Select
                                        value={mapping.type}
                                        onValueChange={(value: 'jwt' | 'sql') => {
                                          form.setValue(`topicSegmentMappings.${index}.type`, value)
                                        }}
                                      >
                                        <SelectTrigger className="w-24">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="jwt">JWT</SelectItem>
                                          <SelectItem value="sql">SQL</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* JWT Claim selector */}
                                    {mapping.type === 'jwt' && (
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs">JWT Claim:</Label>
                                        <Select
                                          value={mapping.jwtClaim}
                                          onValueChange={(value) => {
                                            form.setValue(
                                              `topicSegmentMappings.${index}.jwtClaim`,
                                              value
                                            )
                                          }}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="user_id">user_id</SelectItem>
                                            <SelectItem value="email">email</SelectItem>
                                            <SelectItem value="role">role</SelectItem>
                                            <SelectItem value="sub">sub</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    {/* SQL Query input */}
                                    {mapping.type === 'sql' && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">SQL Condition:</Label>
                                        <Textarea
                                          placeholder="EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')"
                                          value={mapping.sqlQuery}
                                          onChange={(e) => {
                                            form.setValue(
                                              `topicSegmentMappings.${index}.sqlQuery`,
                                              e.target.value
                                            )
                                          }}
                                          className="text-xs font-mono"
                                          rows={2}
                                        />
                                        <p className="text-xs text-foreground-light">
                                          Write a SQL condition that returns true/false. Use{' '}
                                          <code className="bg-surface-100 px-1 rounded">
                                            auth.uid()
                                          </code>{' '}
                                          to get the current user ID, or{' '}
                                          <code className="bg-surface-100 px-1 rounded">
                                            auth.jwt() -&gt;&gt; 'app_metadata' -&gt;&gt; 'role'
                                          </code>{' '}
                                          for JWT claims.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                      </div>
                    )}

                    {form.watch('authorizationStrategy') === 'custom' && (
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="customCondition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom SQL Condition</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter custom SQL condition..."
                                  className="min-h-20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Smart Template Suggestions */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-foreground-light">
                            Smart Template Suggestions:
                          </Label>
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                            {smartTemplates
                              .filter(
                                (template) =>
                                  template.command === 'SELECT' || template.command === 'ALL'
                              )
                              .slice(0, 5) // Show only first 5 relevant templates
                              .map((template) => (
                                <div
                                  key={template.id}
                                  className="flex items-center justify-between p-2 border rounded-md bg-surface-50 hover:bg-surface-100 cursor-pointer"
                                  onClick={() => {
                                    form.setValue('customCondition', template.definition)
                                  }}
                                >
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-foreground">
                                      {template.templateName}
                                    </p>
                                    <p className="text-xs text-foreground-light">
                                      {template.description.slice(0, 80)}...
                                    </p>
                                  </div>
                                  <Button type="text" size="tiny" className="h-6 px-2 text-xs">
                                    Use
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Write Permissions Configuration */}
                    {form.watch('enableWritePermissions') && (
                      <div className="space-y-4 p-4 border rounded-md bg-surface-50">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            Write Permissions Configuration
                          </h4>
                          <p className="text-xs text-foreground-light">
                            Configure who can write messages to the realtime channel
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="writeAuthorizationStrategy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Write Authorization Strategy</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select write authorization strategy" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all_authenticated">
                                      Allow all authenticated users to write
                                    </SelectItem>
                                    <SelectItem value="topic_based">
                                      Topic-based write access control
                                    </SelectItem>
                                    <SelectItem value="custom">Custom write condition</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <p className="text-xs text-foreground-light mt-1">
                                {form.watch('writeAuthorizationStrategy') === 'topic_based' &&
                                  'Check if user has write access based on topic structure'}
                                {form.watch('writeAuthorizationStrategy') === 'custom' &&
                                  'Write custom SQL conditions for write access control'}
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch('writeAuthorizationStrategy') === 'custom' && (
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="writeCustomCondition"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Write SQL Condition</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Enter custom SQL condition for write access..."
                                      className="min-h-20"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Smart Template Suggestions for Write */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-foreground-light">
                                Smart Template Suggestions for Write Access:
                              </Label>
                              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                {smartTemplates
                                  .filter(
                                    (template) =>
                                      template.command === 'INSERT' || template.command === 'ALL'
                                  )
                                  .slice(0, 5) // Show only first 5 relevant templates
                                  .map((template) => (
                                    <div
                                      key={template.id}
                                      className="flex items-center justify-between p-2 border rounded-md bg-surface-50 hover:bg-surface-100 cursor-pointer"
                                      onClick={() => {
                                        form.setValue('writeCustomCondition', template.definition)
                                      }}
                                    >
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-foreground">
                                          {template.templateName}
                                        </p>
                                        <p className="text-xs text-foreground-light">
                                          {template.description.slice(0, 80)}...
                                        </p>
                                      </div>
                                      <Button type="text" size="tiny" className="h-6 px-2 text-xs">
                                        Use
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                              <p className="text-xs text-foreground-light">
                                Click on a template to use it as your custom write condition. These
                                templates are generated based on your table structure.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Preview Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Generated Code Preview</h3>

                  {/* Client Code */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground-light">
                      Client Code (JavaScript/TypeScript)
                    </h4>
                    <div className="relative group">
                      <CodeEditor
                        id="client-code-preview"
                        language="typescript"
                        value={generateClientCode(form.watch())}
                        isReadOnly={true}
                        hideLineNumbers={false}
                        className="h-64"
                        options={{
                          fontSize: 12,
                          theme: 'vs-dark',
                          wordWrap: 'on',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          overviewRulerLanes: 0,
                        }}
                      />
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-surface-100 rounded-md p-1 border border-border">
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Copy className="w-3 h-3" />}
                            onClick={() => {
                              copy(generateClientCode(form.getValues()), { withToast: true })
                            }}
                            className="h-6 px-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Database Trigger Function */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground-light">
                      Database Trigger Function
                    </h4>
                    <div className="relative group">
                      <CodeEditor
                        id="trigger-function-sql-preview"
                        language="pgsql"
                        value={generateTriggerFunctionSQL(form.watch())}
                        isReadOnly={true}
                        hideLineNumbers={false}
                        className="h-48"
                        options={{
                          fontSize: 12,
                          theme: 'vs-dark',
                          wordWrap: 'on',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          overviewRulerLanes: 0,
                        }}
                      />
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-surface-100 rounded-md p-1 border border-border">
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Copy className="w-3 h-3" />}
                            onClick={() => {
                              copy(generateTriggerFunctionSQL(form.getValues()), {
                                withToast: true,
                              })
                            }}
                            className="h-6 px-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Create Trigger Statement */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground-light">
                      Create Trigger Statement
                    </h4>
                    <div className="relative group">
                      <CodeEditor
                        id="create-trigger-sql-preview"
                        language="pgsql"
                        value={generateCreateTriggerSQL(form.watch())}
                        isReadOnly={true}
                        hideLineNumbers={false}
                        className="h-32"
                        options={{
                          fontSize: 12,
                          theme: 'vs-dark',
                          wordWrap: 'on',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          overviewRulerLanes: 0,
                        }}
                      />
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-surface-100 rounded-md p-1 border border-border">
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Copy className="w-3 h-3" />}
                            onClick={() => {
                              copy(generateCreateTriggerSQL(form.getValues()), { withToast: true })
                            }}
                            className="h-6 px-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Read RLS Policy */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground-light">Read RLS Policy</h4>
                    <div className="relative group">
                      <CodeEditor
                        id="read-rls-policy-sql-preview"
                        language="pgsql"
                        value={generateRLSPolicySQL(form.watch(), 'read')}
                        isReadOnly={true}
                        hideLineNumbers={false}
                        className="h-48"
                        options={{
                          fontSize: 12,
                          theme: 'vs-dark',
                          wordWrap: 'on',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          overviewRulerLanes: 0,
                        }}
                      />
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-surface-100 rounded-md p-1 border border-border">
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Copy className="w-3 h-3" />}
                            onClick={() => {
                              copy(generateRLSPolicySQL(form.getValues(), 'read'), {
                                withToast: true,
                              })
                            }}
                            className="h-6 px-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Write RLS Policy */}
                  {form.watch('enableWritePermissions') && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-foreground-light">
                        Write RLS Policy
                      </h4>
                      <div className="relative group">
                        <CodeEditor
                          id="write-rls-policy-sql-preview"
                          language="pgsql"
                          value={generateRLSPolicySQL(form.watch(), 'write')}
                          isReadOnly={true}
                          hideLineNumbers={false}
                          className="h-48"
                          options={{
                            fontSize: 12,
                            theme: 'vs-dark',
                            wordWrap: 'on',
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            overviewRulerLanes: 0,
                          }}
                        />
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1 bg-surface-100 rounded-md p-1 border border-border">
                            <Button
                              type="default"
                              size="tiny"
                              icon={<Copy className="w-3 h-3" />}
                              onClick={() => {
                                copy(generateRLSPolicySQL(form.getValues(), 'write'), {
                                  withToast: true,
                                })
                              }}
                              className="h-6 px-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>

        <SheetFooter className="shrink-0 px-6 py-4 border-t border-border bg-surface-50">
          <Button type="default" onClick={() => setShowRealtimeSettingsSheet(false)}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleConfirmAndExecute} disabled={isExecutingSql}>
            {isExecutingSql ? 'Executing...' : 'Confirm & Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
