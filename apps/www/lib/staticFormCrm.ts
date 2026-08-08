import 'server-only'

import type { GoFormCrmConfig } from 'marketing'

/**
 * CRM config for forms on hand-authored pages that aren't part of the /go
 * page registry. Keyed by `${slug}/${formId}` to match the shape resolved
 * from `getGoPageBySlug` for consistency. See registerFormCrm.ts.
 */
export const staticFormCrmRegistry: Record<string, GoFormCrmConfig> = {
  'partners/become-a-partner': {
    hubspot: {
      formGuid: process.env.HUBSPOT_PARTNER_INTAKE_FORM_GUID ?? '',
      fieldMap: {
        first_name: 'firstname',
        last_name: 'lastname',
        partner_type: 'type_of_partners',
        // Bound to the Company object's `name`/`website` properties (not
        // Contact) in the HubSpot form — the `0-2/` prefix tells
        // HubSpotClient to submit these against objectTypeId '0-2'.
        company_name: '0-2/name',
        company_website: '0-2/website',
      },
    },
    // TODO(DEBR-271): add Notion once a real Tech Partner Intake database_id
    // exists and NOTION_FORMS_API_KEY is set — gate to Technology partners only,
    // e.g. sendWhen: { field: 'partner_type', equals: 'technology' }.
  },
}
