import { parseTemplate, parseTemplateSummary, type Template, type TemplateSummary } from '../schema'

/**
 * Documented wire format for marketplace endpoints. All consumers (composer
 * remote mode, CLI, marketplace page) speak the same protocol.
 *
 *   GET /v1/templates              → TemplateListResponse
 *   GET /v1/templates/{id}         → TemplateResponse (latest)
 *   GET /v1/templates/{id}/{ver}   → TemplateResponse (pinned)
 */

export interface TemplateListResponse {
  templates: TemplateSummary[]
}

export interface TemplateResponse {
  template: Template
}

export function parseTemplateListResponse(payload: unknown): TemplateSummary[] {
  // Accept either a bare array or { templates: [...] } so legacy callers don't
  // break before the v1 endpoints exist.
  if (Array.isArray(payload)) {
    return payload.map(parseTemplateSummary)
  }

  if (isRecord(payload) && Array.isArray(payload.templates)) {
    return payload.templates.map(parseTemplateSummary)
  }

  throw new Error('Template list response must contain a templates array')
}

export function parseTemplateResponse(payload: unknown): Template {
  if (isRecord(payload) && payload.template !== undefined) {
    return parseTemplate(payload.template)
  }

  return parseTemplate(payload)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
