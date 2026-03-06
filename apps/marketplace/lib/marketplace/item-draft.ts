export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function parseRequiredString(formData: FormData, key: string) {
  const raw = formData.get(key)
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`Missing required field: ${key}`)
  }

  return raw.trim()
}

export function parseOptionalString(formData: FormData, key: string) {
  const raw = formData.get(key)
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed ? trimmed : null
}

export function parseNumberList(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .flatMap((value) => {
          if (typeof value !== 'string') return []
          const parsed = Number(value)
          return Number.isInteger(parsed) && parsed > 0 ? [parsed] : []
        })
        .sort((a, b) => a - b)
    )
  )
}

function isFileLikeFormDataEntry(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value === 'string') return false

  const maybeFile = value as Partial<File>
  return typeof maybeFile.arrayBuffer === 'function' && typeof maybeFile.size === 'number'
}

export function parseTemplateZip(formData: FormData) {
  const raw = formData.get('templateZip')
  if (!isFileLikeFormDataEntry(raw) || raw.size === 0) {
    return null
  }
  return raw
}

export function parseItemType(rawType: string) {
  return rawType === 'oauth' ? 'oauth' : rawType === 'template' ? 'template' : null
}

export function ensureItemDraftConstraints({
  type,
  slug,
  url,
  templateZip,
  existingRegistryItemUrl,
  published = false,
  intent = 'save',
}: {
  type: 'oauth' | 'template' | null
  slug: string
  url: string | null
  templateZip: File | null
  existingRegistryItemUrl?: string | null
  published?: boolean
  intent?: 'save' | 'request_review'
}): asserts type is 'oauth' | 'template' {
  if (!slug) {
    throw new Error('Item slug cannot be empty')
  }
  if (!type) {
    throw new Error('Invalid item type')
  }
  if (type === 'oauth' && !url) {
    throw new Error('OAuth items require a listing URL')
  }
  const requiresTemplatePackage = type === 'template' && (published || intent === 'request_review')
  if (requiresTemplatePackage && !templateZip && !existingRegistryItemUrl) {
    throw new Error('Template items require a template ZIP package before publishing or requesting review')
  }
}
