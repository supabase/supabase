import { z } from 'zod'

const ComponentStatus = z.enum([
  'operational',
  'degraded_performance',
  'partial_outage',
  'full_outage',
])
const WorstImpact = z.enum(['degraded_performance', 'partial_outage', 'full_outage'])

export const AffectedComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  group_name: z.string().nullish(),
  current_status: ComponentStatus.catch('degraded_performance'),
})

const Base = {
  id: z.string(),
  name: z.string(),
  url: z.string(),
  last_update_at: z.string(),
  last_update_message: z.string().nullish(),
  affected_components: z.array(AffectedComponentSchema).default([]),
}

export const WidgetIncidentSchema = z.object({
  ...Base,
  status: z.enum(['investigating', 'identified', 'monitoring']).catch('investigating'),
  current_worst_impact: WorstImpact.catch('full_outage'),
})

export const WidgetInProgressMaintenanceSchema = z.object({
  ...Base,
  status: z.literal('maintenance_in_progress').catch('maintenance_in_progress'),
  started_at: z.string(),
  scheduled_end_at: z.string().nullish(),
})

export const WidgetScheduledMaintenanceSchema = z.object({
  ...Base,
  status: z.literal('maintenance_scheduled').catch('maintenance_scheduled'),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
})

function tolerantArray<T extends z.ZodTypeAny>(itemSchema: T, arrayName: string) {
  return z
    .array(z.unknown())
    .default([])
    .transform(
      (items): Array<z.output<T>> =>
        items.flatMap((item) => {
          const result = itemSchema.safeParse(item)
          if (result.success) return [result.data]

          const rawId =
            typeof item === 'object' && item !== null && 'id' in item
              ? (item as { id?: unknown }).id
              : undefined
          console.warn(`incident.io Widget API: dropping malformed item in ${arrayName}`, {
            id: rawId,
            issues: result.error.issues,
          })
          return []
        })
    )
}

export const WidgetResponseSchema = z.object({
  page_title: z.string(),
  page_url: z.string(),
  ongoing_incidents: tolerantArray(WidgetIncidentSchema, 'ongoing_incidents'),
  in_progress_maintenances: tolerantArray(
    WidgetInProgressMaintenanceSchema,
    'in_progress_maintenances'
  ),
  scheduled_maintenances: tolerantArray(WidgetScheduledMaintenanceSchema, 'scheduled_maintenances'),
})

const Annotations = { visible: z.boolean(), show_banner: z.boolean() }

export const StatusPageResponseSchema = WidgetResponseSchema.extend({
  ongoing_incidents: z.array(WidgetIncidentSchema.extend(Annotations)),
  in_progress_maintenances: z.array(WidgetInProgressMaintenanceSchema.extend(Annotations)),
  scheduled_maintenances: z.array(
    WidgetScheduledMaintenanceSchema.extend({
      ...Annotations,
      banner_lead_days: z.number().positive().nullable(),
    })
  ),
})

export type WidgetResponse = z.infer<typeof WidgetResponseSchema>
export type StatusPageResponse = z.infer<typeof StatusPageResponseSchema>
export type AffectedComponent = z.infer<typeof AffectedComponentSchema>
