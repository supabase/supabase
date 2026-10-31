// @ts-check

/**
 * Fetches the live "Become a Partner" HubSpot form schema and writes a
 * normalized snapshot to __generated__/partner-intake-form.hubspot.json.
 *
 * HubSpot's own embeddable-form widget (and share.hsforms.com links) loads
 * the form definition from a public, keyless JSON(P) endpoint — the same one
 * used here. `portalId`/`formGuid` aren't secrets: they're recoverable from
 * any public share link or the embed page's own source, so it's safe to
 * check them into the repo. They should match the (secret-adjacent, but not
 * actually secret) HUBSPOT_PORTAL_ID / HUBSPOT_PARTNER_INTAKE_FORM_GUID env
 * vars used at submission time in apps/www/lib/staticFormCrm.ts.
 *
 * This snapshot is NOT rendered directly — PartnerIntakeForm.tsx stays
 * hand-authored for curated copy/layout. PartnerIntakeForm.sync.test.ts
 * cross-checks the hand-authored form against this file so drift between
 * the two fails CI instead of silently breaking submissions. Re-run this
 * script (`pnpm run sync:partner-form`) whenever that test starts failing
 * after a snapshot update, and reconcile PartnerIntakeForm.tsx / staticFormCrm.ts
 * by hand.
 */

import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'components', 'Partners', '__generated__')
const OUT_FILE = join(OUT_DIR, 'partner-intake-form.hubspot.json')

// Decoded from the share link https://share.hsforms.com/1ZSo-7Y0GRfuTdvWusOP13Abvo3m
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || '19953346'
const FORM_GUID =
  process.env.HUBSPOT_PARTNER_INTAKE_FORM_GUID || '652a3eed-8d06-45fb-9376-f5aeb0e3f5dc'

async function fetchFormSchema(portalId, formGuid) {
  const url = `https://forms.hubspot.com/embed/v3/form/${portalId}/${formGuid}?callback=cb`
  const res = await fetch(url, { headers: { 'User-Agent': 'supabase-www-build' } })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)

  const body = await res.text()
  const jsonpMatch = body.match(/^cb\((.*)\)$/s)
  if (!jsonpMatch)
    throw new Error(`Unexpected response shape from HubSpot embed endpoint: ${body.slice(0, 200)}`)

  const data = JSON.parse(jsonpMatch[1])
  if (!data.form) throw new Error(`HubSpot response missing "form": ${body.slice(0, 200)}`)
  return data.form
}

function normalizeField(field, dependsOn) {
  const normalized = {
    name: field.name,
    label: field.label,
    fieldType: field.fieldType,
    required: Boolean(field.required),
    options: (field.options ?? []).map((o) => ({ label: o.label, value: o.value })),
  }
  if (field.description) normalized.description = field.description
  if (dependsOn) normalized.dependsOn = dependsOn
  return normalized
}

/**
 * Flattens `formFieldGroups[].fields[]` plus every nested
 * `dependentFieldFilters[].dependentFormField` into one flat list, recording
 * which field/values a dependent field is conditional on.
 */
function flattenFields(form) {
  const fields = []
  for (const group of form.formFieldGroups ?? []) {
    for (const field of group.fields ?? []) {
      fields.push(normalizeField(field))
      for (const dep of field.dependentFieldFilters ?? []) {
        const trigger = dep.filters?.[0]
        fields.push(
          normalizeField(dep.dependentFormField, {
            field: field.name,
            values: trigger?.strValues ?? [],
          })
        )
      }
    }
  }
  return fields
}

async function main() {
  console.log(`Fetching HubSpot form ${FORM_GUID} (portal ${PORTAL_ID})`)
  const form = await fetchFormSchema(PORTAL_ID, FORM_GUID)

  const snapshot = {
    portalId: form.portalId,
    formGuid: form.guid,
    submitText: form.submitText,
    fields: flattenFields(form),
  }

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n')

  console.log(`Wrote ${snapshot.fields.length} fields → ${OUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
