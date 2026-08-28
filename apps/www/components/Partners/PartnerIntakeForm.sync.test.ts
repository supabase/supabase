import { describe, expect, it, vi } from 'vitest'

import hubspotSnapshotJson from './__generated__/partner-intake-form.hubspot.json'
import { fields } from './PartnerIntakeForm.fields'
import { staticFormCrmRegistry } from '@/lib/staticFormCrm'

// staticFormCrm.ts is `import 'server-only'` gated; that guard throws when
// bundled for a client, but under plain Node/Vitest (no Next.js webpack
// aliasing) it throws unconditionally, so it must be stubbed for this test.
vi.mock('server-only', () => ({}))

/**
 * Cross-checks PartnerIntakeForm.tsx + staticFormCrm.ts against the
 * generated HubSpot schema snapshot (apps/www/scripts/syncPartnerIntakeForm.mjs).
 *
 * This is the actual "can't silently drift" guarantee: re-run
 * `pnpm run sync:partner-form` to refresh the snapshot from the live
 * HubSpot form, and this test starts failing the moment the snapshot no
 * longer matches the hand-authored form — forcing a deliberate update to
 * PartnerIntakeForm.tsx / staticFormCrm.ts instead of a silent HubSpot
 * submission failure.
 */

interface HubSpotFieldSnapshot {
  name: string
  label: string
  fieldType: string
  required: boolean
  options: { label: string; value: string }[]
  description?: string
  dependsOn?: { field: string; values: string[] }
}

const hubspotSnapshot = hubspotSnapshotJson as {
  portalId: number
  formGuid: string
  fields: HubSpotFieldSnapshot[]
}

const crmConfig = staticFormCrmRegistry['partners/become-a-partner']?.hubspot
if (!crmConfig) {
  throw new Error(
    "Expected a hubspot CRM config for 'partners/become-a-partner' in staticFormCrm.ts"
  )
}

const fieldMap = crmConfig.fieldMap ?? {}
const excludeFields = new Set(crmConfig.excludeFields ?? [])
const hubspotFieldsByName = new Map(hubspotSnapshot.fields.map((f) => [f.name, f]))

// Company-object fields are bound via a `0-2/` prefix (see HubSpotClient) and
// aren't part of the Contact-field schema this endpoint returns — treat them
// as known rather than flagging them as unmapped.
const KNOWN_NON_CONTACT_FIELDS = new Set(['name', 'website'])

/** The HubSpot property name a given app field forwards to. */
function hubspotNameFor(appFieldName: string): string {
  const mapped = fieldMap[appFieldName] ?? appFieldName
  const slashIndex = mapped.indexOf('/')
  return slashIndex === -1 ? mapped : mapped.slice(slashIndex + 1)
}

describe('PartnerIntakeForm HubSpot sync', () => {
  it('maps every required, non-excluded HubSpot field to an app field', () => {
    const forwardedHubspotNames = new Set(
      fields.filter((f) => !excludeFields.has(f.name)).map((f) => hubspotNameFor(f.name))
    )

    const missing = hubspotSnapshot.fields
      .filter((f) => f.required)
      .map((f) => f.name)
      .filter((name) => !forwardedHubspotNames.has(name))

    expect(missing).toEqual([])
  })

  it('forwards every non-excluded app field to a HubSpot property that actually exists', () => {
    // An app field forwarded to a HubSpot property HubSpot doesn't define
    // causes the *entire* HubSpot submission to fail (see HubSpotClient).
    const unknown = fields
      .filter((f) => !excludeFields.has(f.name))
      .map((f) => hubspotNameFor(f.name))
      .filter((name) => !KNOWN_NON_CONTACT_FIELDS.has(name))
      .filter((name) => !hubspotFieldsByName.has(name))

    expect(unknown).toEqual([])
  })

  it('keeps option values in exact sync for every mapped select/checkbox-group field', () => {
    // Checked in BOTH directions: a value we send that HubSpot doesn't
    // recognize, and — the bug that slipped through when this only checked
    // one direction — a live HubSpot option we're not offering at all (e.g.
    // a "Marketplace Partner" option nobody could ever select).
    const mismatches: string[] = []

    for (const field of fields) {
      if (field.type !== 'select' && field.type !== 'checkbox-group') continue
      if (excludeFields.has(field.name)) continue

      const hubspotName = hubspotNameFor(field.name)
      const hubspotField = hubspotFieldsByName.get(hubspotName)
      if (!hubspotField || hubspotField.options.length === 0) continue

      const ourValues = new Set(field.options.map((o) => o.value))
      const hubspotValues = new Set(hubspotField.options.map((o) => o.value))

      for (const value of ourValues) {
        if (!hubspotValues.has(value)) {
          mismatches.push(`${field.name}: "${value}" is not a valid ${hubspotName} option`)
        }
      }
      for (const value of hubspotValues) {
        if (!ourValues.has(value)) {
          mismatches.push(`${field.name}: missing HubSpot's "${value}" option for ${hubspotName}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })
})
