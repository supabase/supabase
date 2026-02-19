'use server'

import { CRMClient, type CRMConfig } from '../../crm'
import type { GoFormCrmConfig } from '../schemas'

export interface FormSubmitResult {
  success: boolean
  errors: string[]
}

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
  const hubspotPortalId = process.env.HUBSPOT_PORTAL_ID
  const customerioSiteId = process.env.CUSTOMERIO_SITE_ID
  const customerioApiKey = process.env.CUSTOMERIO_API_KEY

  if (crm.hubspot && crm.customerio) {
    if (!hubspotPortalId) throw new Error('HUBSPOT_PORTAL_ID env var is not set')
    if (!customerioSiteId) throw new Error('CUSTOMERIO_SITE_ID env var is not set')
    if (!customerioApiKey) throw new Error('CUSTOMERIO_API_KEY env var is not set')
    return {
      hubspot: { portalId: hubspotPortalId, formGuid: crm.hubspot.formGuid },
      customerio: { siteId: customerioSiteId, apiKey: customerioApiKey },
    }
  }
  if (crm.hubspot) {
    if (!hubspotPortalId) throw new Error('HUBSPOT_PORTAL_ID env var is not set')
    return { hubspot: { portalId: hubspotPortalId, formGuid: crm.hubspot.formGuid } }
  }
  // customerio only (guaranteed by schema refinement that at least one exists)
  if (!customerioSiteId) throw new Error('CUSTOMERIO_SITE_ID env var is not set')
  if (!customerioApiKey) throw new Error('CUSTOMERIO_API_KEY env var is not set')
  return { customerio: { siteId: customerioSiteId, apiKey: customerioApiKey } }
}

/**
 * Submit form values to the configured CRM providers (HubSpot and/or Customer.io).
 *
 * Credentials are read from environment variables:
 *   - HubSpot:     HUBSPOT_PORTAL_ID
 *   - Customer.io: CUSTOMERIO_SITE_ID, CUSTOMERIO_API_KEY
 *
 * Per-form config (formGuid, event name, field mappings) lives in the page definition.
 */
export async function submitFormAction(
  crm: GoFormCrmConfig,
  values: Record<string, string>,
  context?: { pageUri?: string; pageName?: string }
): Promise<FormSubmitResult> {
  debug('Form submission received', { crm, values, context })

  try {
    // Detect the email value from common field names
    const email =
      values['email'] ?? values['workEmail'] ?? values['work_email'] ?? values['emailAddress'] ?? ''

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
      for (const [formField, value] of Object.entries(values)) {
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
        customerioProfile[attrName] = values[formField]
      }
    }
    if (crm.customerio) {
      debug('Customer.io payload', {
        event: crm.customerio.event,
        properties: values,
        customerioProfile,
      })
    }

    // submitEvent is typed via generics — cast to any to avoid fighting the conditional types
    // (the runtime behavior is correct: CRMClient checks which clients are configured)
    const { errors } = await (client as CRMClient).submitEvent({
      email,
      hubspotFields,
      context,
      consent,
      event: crm.customerio?.event,
      properties: crm.customerio ? (values as Record<string, unknown>) : undefined,
      customerioProfile,
    } as any)

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
