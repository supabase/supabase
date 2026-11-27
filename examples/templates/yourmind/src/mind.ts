import { itemSchema, items, type Item } from './collections'
import { supabase } from './supabase'

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function newItem(userId: string, fields: Partial<Item> & Pick<Item, 'kind'>): Item {
  return {
    id: crypto.randomUUID(),
    title: null,
    body: null,
    url: null,
    site_name: null,
    image_url: null,
    image_path: null,
    status: 'processing',
    created_by: userId,
    created_at: new Date().toISOString(),
    ...fields,
  }
}

const requested = new Set<string>()
// Items whose insert is still on its way to the database. processPending
// skips these: saveItem processes them itself once the insert commits.
const saving = new Set<string>()

/**
 * Asks the save-item function to add a preview and embedding, then writes the
 * finished row straight into the collection (Realtime would also deliver it,
 * but this doesn't depend on the subscription being connected yet).
 */
async function processItem(id: string) {
  if (requested.has(id)) return
  requested.add(id)
  const { data, error } = await supabase.functions.invoke<{ item: unknown }>('save-item', {
    body: { id },
  })
  const parsed = itemSchema.safeParse(data?.item)
  if (!error && parsed.success) {
    items.utils.writeUpsert(parsed.data)
  } else if (items.has(id)) {
    items.update(id, (draft) => void (draft.status = 'failed'))
  }
}

/** Finishes any items still marked as processing, such as seeds or interrupted saves. */
export function processPending(list: Item[]) {
  for (const item of list) {
    if (item.status === 'processing' && !saving.has(item.id)) void processItem(item.id)
  }
}

async function saveItem(item: Item) {
  saving.add(item.id)
  try {
    const transaction = items.insert(item)
    await transaction.isPersisted.promise
  } finally {
    saving.delete(item.id)
  }
  await processItem(item.id)
}

/** A normalized http(s) URL, or null if the text isn't one. */
function parseHttpUrl(text: string) {
  try {
    const url = new URL(text)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Saves text as a link when it's a URL, otherwise as a note. */
export function saveText(userId: string, text: string) {
  const trimmed = text.trim()
  const hasScheme = /^https?:\/\/\S+$/i.test(trimmed)
  const isUrl = hasScheme || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed)
  if (isUrl) {
    const url = parseHttpUrl(hasScheme ? trimmed : `https://${trimmed}`)
    if (!url) return Promise.reject(new Error('That link doesn’t look right. Check it and try again.'))
    return saveItem(newItem(userId, { kind: 'link', url }))
  }
  return saveItem(newItem(userId, { kind: 'note', body: trimmed }))
}

/** Uploads an image to the private bucket, then saves it as an item. */
export async function saveImage(userId: string, file: File) {
  const extension = IMAGE_EXTENSIONS[file.type]
  if (!extension) throw new Error('Use a JPEG, PNG, WebP or GIF image.')
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Images can be up to 5 MB.')

  const item = newItem(userId, { kind: 'image', title: file.name.replace(/\.[^.]+$/, '') })
  const path = `${userId}/${item.id}.${extension}`
  const { error } = await supabase.storage
    .from('minds')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' })
  if (error) throw error
  try {
    await saveItem({ ...item, image_path: path })
  } catch (error) {
    // The item was rejected: don't leave the uploaded image behind.
    await supabase.storage.from('minds').remove([path])
    throw error
  }
}

export async function deleteItem(item: Item) {
  // Remove the image first and only delete the item once Storage confirms it.
  if (item.image_path) {
    const { data, error } = await supabase.storage.from('minds').remove([item.image_path])
    if (error) throw error
    if (data.length === 0) throw new Error('Could not delete the image. Try again.')
  }
  await items.delete(item.id).isPersisted.promise
}

/** Ranks your items by meaning. Returns item ids, best match first. */
export async function searchMind(query: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke<{
    matches: { item_id: string; similarity: number }[]
  }>('search', { body: { query } })
  if (error) throw error
  return (data?.matches ?? []).map((match) => match.item_id)
}

const STARTER_ITEMS = [
  {
    kind: 'note' as const,
    body: 'Write down every idea, even the half-formed ones. Most of them only make sense a week later.',
  },
  { kind: 'link' as const, url: 'https://en.wikipedia.org/wiki/Memex' },
  { kind: 'link' as const, url: 'https://supabase.com/docs/guides/ai/semantic-search' },
  {
    kind: 'note' as const,
    body: 'Recipe to try: miso butter pasta with crispy shallots and a squeeze of lemon.',
  },
  { kind: 'link' as const, url: 'https://en.wikipedia.org/wiki/Japanese_garden' },
  {
    kind: 'note' as const,
    body: 'Book list for the trip: The Overstory, Piranesi, A Psalm for the Wild-Built.',
  },
]

let seeding: Promise<void> | null = null

/** Gives a new visitor a few items to search. Runs once per page load. */
export function seedMind(userId: string): Promise<void> {
  seeding ??= (async () => {
    const { count, error } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    if (count && count > 0) return
    // Oldest first, so the first note ends up at the top.
    for (const starter of [...STARTER_ITEMS].reverse()) {
      const item = newItem(userId, starter)
      const { error: insertError } = await supabase.from('items').insert(item)
      if (insertError) throw insertError
      // The app processes these (previews and embeddings) once it loads them.
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
  })()
  return seeding
}

const SIGNED_URL_SECONDS = 3600
// Reuse a signed URL for a while, then sign a fresh one before it expires.
const SIGNED_URL_REUSE_MS = (SIGNED_URL_SECONDS - 600) * 1000
const signedUrls = new Map<string, { url: Promise<string | null>; expiresAt: number }>()

/** Signed, resized URL for an image in the private bucket. */
export function imageUrl(path: string, width = 600) {
  const key = `${path}@${width}`
  const cached = signedUrls.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const url = supabase.storage
    .from('minds')
    .createSignedUrl(path, SIGNED_URL_SECONDS, {
      transform: { width, resize: 'contain', quality: 75 },
    })
    .then(({ data }) => data?.signedUrl ?? null)
  signedUrls.set(key, { url, expiresAt: Date.now() + SIGNED_URL_REUSE_MS })
  return url
}
