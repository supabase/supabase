'use server'

import { CRMClient, type CRMConfig } from '../../crm'
import type { GoFormCrmConfig } from '../schemas'

export interface FormSubmitResult {
  success: boolean
  errors: string[]
}

/** Hidden field added by MarketingForm — bots fill it, humans never see it. */
const HONEYPOT_FIELD = 'website'

/** Minimum milliseconds a form must be on the page before a submission is accepted. */
const MIN_FORM_RENDER_MS = 3000

// Enable debug logging in local dev and on Vercel preview/development deployments
const isDebug =
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.VERCEL_ENV === 'development'

function debug(message: string, data?: unknown) {
  if (!isDebug) return
  if (data !== undefined) {
    console.log(`[go/form] ${message}`, JSON.stringify(data, null, 2))
  } else {
    console.log(`[go/form] ${message}`)
  }
}

function buildCrmConfig(crm: GoFormCrmConfig): CRMConfig {
  const config: CRMConfig = {}

  if (crm.hubspot) {
    const hubspotPortalId = process.env.HUBSPOT_PORTAL_ID
    if (!hubspotPortalId) throw new Error('HUBSPOT_PORTAL_ID env var is not set')
    config.hubspot = { portalId: hubspotPortalId, formGuid: crm.hubspot.formGuid }
  }

  if (crm.customerio) {
    const customerioSiteId = process.env.CUSTOMERIO_SITE_ID
    const customerioApiKey = process.env.CUSTOMERIO_API_KEY
    if (!customerioSiteId) throw new Error('CUSTOMERIO_SITE_ID env var is not set')
    if (!customerioApiKey) throw new Error('CUSTOMERIO_API_KEY env var is not set')
    config.customerio = { siteId: customerioSiteId, apiKey: customerioApiKey }
  }

  if (crm.notion) {
    const notionApiKey = process.env.NOTION_FORMS_API_KEY
    if (!notionApiKey) throw new Error('NOTION_FORMS_API_KEY env var is not set')
    config.notion = { apiKey: notionApiKey }
  }

  return config
}

/**
 * Submit form values to the configured CRM providers (HubSpot, Customer.io, Notion).
 *
 * Credentials are read from environment variables:
 *   - HubSpot:     HUBSPOT_PORTAL_ID
 *   - Customer.io: CUSTOMERIO_SITE_ID, CUSTOMERIO_API_KEY
 *   - Notion:      NOTION_FORMS_API_KEY
 *
 * Per-form config (formGuid, event name, database_id, field mappings) lives in the page definition.
 */
export async function submitFormAction(
  crm: GoFormCrmConfig,
  values: Record<string, string>,
  context?: { pageUri?: string; pageName?: string; honeypot?: string; formMountedAt?: number }
): Promise<FormSubmitResult> {
  debug('Form submission received', { crm, values, context })

  // Anti-spam: honeypot tripped or form submitted suspiciously fast. Return a
  // fake success so bots think they got through and don't retry with variations.
  const honeypot = context?.honeypot ?? values[HONEYPOT_FIELD] ?? ''
  if (honeypot.trim() !== '') {
    console.warn('[go/form] Rejected submission: honeypot tripped', {
      pageUri: context?.pageUri,
    })
    return { success: true, errors: [] }
  }

  if (
    typeof context?.formMountedAt === 'number' &&
    Date.now() - context.formMountedAt < MIN_FORM_RENDER_MS
  ) {
    console.warn('[go/form] Rejected submission: form submitted too quickly', {
      pageUri: context.pageUri,
      elapsedMs: Date.now() - context.formMountedAt,
    })
    return { success: true, errors: [] }
  }

  try {
    // The honeypot field is never part of the real payload, even if a real
    // form happens to include a `website` field name.
    const { [HONEYPOT_FIELD]: _honeypot, ...payloadValues } = values

    // Detect the email value from common field names
    const email =
      payloadValues['email'] ??
      payloadValues['workEmail'] ??
      payloadValues['work_email'] ??
      payloadValues['emailAddress'] ??
      payloadValues['email_address'] ??
      ''

    if (!email) {
      debug('Submission rejected: no email field found in values')
      return { success: false, errors: ['An email field is required for form submission.'] }
    }

    let client: CRMClient
    try {
      const crmConfig = buildCrmConfig(crm)
      debug('CRM config built', {
        providers: Object.keys(crmConfig),
        hubspot: crm.hubspot ? { formGuid: crm.hubspot.formGuid } : undefined,
        customerio: crm.customerio ? { event: crm.customerio.event } : undefined,
        notion: crm.notion ? { database_id: crm.notion.database_id } : undefined,
      })
      client = new CRMClient(crmConfig)
    } catch (err: any) {
      debug('CRM config error', { error: err.message })
      return { success: false, errors: [err.message] }
    }

    // Build HubSpot fields: apply optional field name mapping
    let hubspotFields: Record<string, string> | undefined
    let consent: string | undefined
    if (crm.hubspot) {
      const fieldMap = crm.hubspot.fieldMap ?? {}
      hubspotFields = {}
      for (const [formField, value] of Object.entries(payloadValues)) {
        const hsField = fieldMap[formField] ?? formField
        hubspotFields[hsField] = value
      }
      consent = crm.hubspot.consent
      debug('HubSpot payload', { hubspotFields, consent, context })
    }

    // Build Customer.io profile attributes from the profileMap
    let customerioProfile: Record<string, unknown> | undefined
    if (crm.customerio?.profileMap) {
      customerioProfile = {}
      for (const [formField, attrName] of Object.entries(crm.customerio.profileMap)) {
        customerioProfile[attrName] = payloadValues[formField]
      }
    }
    if (crm.customerio) {
      debug('Customer.io payload', {
        event: crm.customerio.event,
        properties: payloadValues,
        customerioProfile,
      })
    }

    // Build Notion page properties: map form fields via columnMap, then merge staticProperties
    let notion: { databaseId: string; properties: Record<string, unknown> } | undefined
    if (crm.notion) {
      const columnMap = crm.notion.columnMap ?? {}
      const properties: Record<string, unknown> = {}
      for (const [formField, columnName] of Object.entries(columnMap)) {
        if (formField in payloadValues) {
          properties[columnName] = payloadValues[formField]
        }
      }
      if (crm.notion.staticProperties) {
        Object.assign(properties, crm.notion.staticProperties)
      }
      notion = { databaseId: crm.notion.database_id, properties }
      debug('Notion payload', { databaseId: crm.notion.database_id, properties })
    }

    const { errors } = await client.submitEvent({
      email,
      hubspotFields,
      context: context && { pageUri: context.pageUri, pageName: context.pageName },
      consent,
      event: crm.customerio?.event,
      properties: crm.customerio
        ? { ...(payloadValues as Record<string, unknown>), ...crm.customerio.staticProperties }
        : undefined,
      customerioProfile,
      notion,
    })

    if (errors.length > 0) {
      debug(
        'CRM submission errors',
        errors.map((e) => e.message)
      )
      return { success: false, errors: errors.map((e) => e.message) }
    }

    debug('Submission successful')
    return { success: true, errors: [] }
  } catch (err: any) {
    // Catch any unexpected error so the client always gets a FormSubmitResult
    console.error('[go/form] Unexpected error during form submission:', err)
    return {
      success: false,
      errors: [
        isDebug ? `Unexpected error: ${err.message}` : 'Something went wrong. Please try again.',
      ],
    }
  }
}
