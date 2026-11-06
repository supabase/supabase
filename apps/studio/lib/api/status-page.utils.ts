import type { StatusPageResponse, WidgetResponse } from '@/lib/status-page/status-page.schema'

export type CustomFieldValue = {
  value_option?: { value: string } | null
  value_text?: string | null
  value_numeric?: string | null
}

export type CustomFieldEntry = {
  custom_field: { id: string }
  values: Array<CustomFieldValue>
}

export type ResponseIncident = {
  id: string
  custom_field_entries: Array<CustomFieldEntry>
}

const TRUE_VALUES = new Set(['yes', 'true', '1'])

export function readCustomFieldFlag(entries: Array<CustomFieldEntry>, fieldId: string): boolean {
  if (!fieldId) return false

  const entry = entries.find((e) => e.custom_field.id === fieldId)
  if (!entry) return false

  return entry.values.some((value) => {
    const text = (value.value_option?.value ?? value.value_text ?? '').trim().toLowerCase()
    if (TRUE_VALUES.has(text)) return true

    if (value.value_numeric != null) {
      const numeric = Number(value.value_numeric)
      return Number.isFinite(numeric) && numeric > 0
    }

    return false
  })
}

export function readCustomFieldNumber(
  entries: Array<CustomFieldEntry>,
  fieldId: string
): number | null {
  if (!fieldId) return null

  const entry = entries.find((e) => e.custom_field.id === fieldId)
  if (!entry) return null

  for (const value of entry.values) {
    const raw = value.value_numeric ?? value.value_option?.value ?? value.value_text
    if (raw == null) continue

    const numeric = Number(raw)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
  }

  return null
}

export type ResponseIncidentFlags = {
  hideBanner: boolean
  modeFlags: Record<string, boolean>
  leadDays: number | null
}

export type ResponseIncidentFieldIds = {
  hideBannerFieldId: string
  leadDaysFieldId: string
}

export function mergeLinkedFlags(
  incidents: Array<ResponseIncident>,
  modeFieldIds: Array<string>,
  fieldIds: ResponseIncidentFieldIds
): ResponseIncidentFlags {
  const modeFlags: Record<string, boolean> = {}
  for (const fieldId of modeFieldIds.filter(Boolean)) {
    modeFlags[fieldId] = incidents.some((incident) =>
      readCustomFieldFlag(incident.custom_field_entries, fieldId)
    )
  }

  const hideBanner = incidents.every((incident) =>
    readCustomFieldFlag(incident.custom_field_entries, fieldIds.hideBannerFieldId)
  )

  const leadDaysValues = incidents
    .map((incident) =>
      readCustomFieldNumber(incident.custom_field_entries, fieldIds.leadDaysFieldId)
    )
    .filter((value): value is number => value !== null)

  return {
    hideBanner,
    modeFlags,
    leadDays: leadDaysValues.length > 0 ? Math.max(...leadDaysValues) : null,
  }
}

export function computeAnnotations(
  flags: ResponseIncidentFlags | undefined,
  modeFieldIds: Array<string>
): { visible: boolean; show_banner: boolean; banner_lead_days: number | null } {
  if (!flags) {
    return { visible: true, show_banner: true, banner_lead_days: null }
  }

  const [own = ''] = modeFieldIds
  const anySet = modeFieldIds.filter(Boolean).some((id) => flags.modeFlags[id])
  const visible = !anySet || (own !== '' && flags.modeFlags[own] === true)

  return {
    visible,
    show_banner: !flags.hideBanner,
    banner_lead_days: flags.leadDays,
  }
}

export function annotateWidget(
  widget: WidgetResponse,
  flagsById: Map<string, ResponseIncidentFlags>,
  modeFieldIds: Array<string>
): StatusPageResponse {
  const withBaseAnnotations = <T extends { id: string }>(item: T) => {
    const { visible, show_banner } = computeAnnotations(flagsById.get(item.id), modeFieldIds)
    return { ...item, visible, show_banner }
  }

  return {
    ...widget,
    ongoing_incidents: widget.ongoing_incidents.map(withBaseAnnotations),
    in_progress_maintenances: widget.in_progress_maintenances.map(withBaseAnnotations),
    scheduled_maintenances: widget.scheduled_maintenances.map((item) => {
      const annotations = computeAnnotations(flagsById.get(item.id), modeFieldIds)
      return { ...item, ...annotations }
    }),
  }
}
