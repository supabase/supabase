'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import JSZip from 'jszip'

import {
  ensureItemDraftConstraints,
  parseItemType,
  parseNumberList,
  parseOptionalString,
  parseRequiredString,
  parseTemplateZip,
  slugify,
} from '@/lib/marketplace/item-draft'
import { isReviewStatus, shouldRequestReview } from '@/lib/marketplace/review-state'
import {
  hasRequiredTemplateEntries,
  inferTemplateRootPrefix,
  normalizeTemplatePath,
  shouldIgnoreTemplatePath,
} from '@/lib/marketplace/template-package'
import { createClient } from '@/lib/supabase/server'

async function uploadTemplatePackage({
  zipFile,
  supabase,
  partnerId,
  itemId,
}: {
  zipFile: File
  supabase: Awaited<ReturnType<typeof createClient>>
  partnerId: number
  itemId: number
}) {
  const arrayBuffer = await zipFile.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)
  const entries = Object.values(zip.files).filter(
    (entry) => !entry.dir && !shouldIgnoreTemplatePath(entry.name)
  )

  if (entries.length === 0) {
    throw new Error('Template package must contain files')
  }

  const entryPaths = entries.map((entry) => entry.name)
  const rootPrefix = inferTemplateRootPrefix(entryPaths)

  const normalizedEntries = entries
    .map((entry) => ({
      entry,
      relativePath: normalizeTemplatePath(entry.name, rootPrefix),
    }))
    .filter((entry) => entry.relativePath.length > 0)

  if (!hasRequiredTemplateEntries(entryPaths)) {
    throw new Error(
      'Template package must include registry-item.json plus files in functions/ and schemas/'
    )
  }

  const basePath = `${partnerId}/items/${itemId}/template`

  const listStorageFilesRecursively = async (prefix = ''): Promise<string[]> => {
    const targetPath = prefix ? `${basePath}/${prefix}` : basePath
    const { data, error } = await supabase.storage.from('item_files').list(targetPath, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error || !data) return []

    const nested = await Promise.all(
      data.map(async (entry) => {
        const isDirectory = entry.metadata == null
        const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name
        if (isDirectory) {
          return listStorageFilesRecursively(nextPrefix)
        }
        return [`${basePath}/${nextPrefix}`]
      })
    )

    return nested.flat()
  }

  const existingTemplatePaths = await listStorageFilesRecursively()
  if (existingTemplatePaths.length > 0) {
    const { error: removeError } = await supabase.storage.from('item_files').remove(existingTemplatePaths)
    if (removeError) {
      throw new Error(removeError.message)
    }
  }

  for (const normalizedEntry of normalizedEntries) {
    const blob = await normalizedEntry.entry.async('blob')
    const objectPath = `${basePath}/${normalizedEntry.relativePath}`
    const { error } = await supabase.storage.from('item_files').upload(objectPath, blob, {
      upsert: true,
      contentType: blob.type || undefined,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const registryFilePath = `${basePath}/registry-item.json`
  const {
    data: { publicUrl },
  } = supabase.storage.from('item_files').getPublicUrl(registryFilePath)

  return publicUrl
}

export async function createPartnerAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const title = parseRequiredString(formData, 'title')
  const slugInput = formData.get('slug')
  const description = formData.get('description')
  const slugSource = typeof slugInput === 'string' && slugInput.trim() ? slugInput : title
  const slug = slugify(slugSource)

  if (!slug) {
    throw new Error('Partner slug cannot be empty')
  }

  const { data: partner, error } = await supabase
    .from('partners')
    .insert({
      title,
      slug,
      description: typeof description === 'string' ? description : null,
      created_by: user.id,
    })
    .select('id, slug')
    .single()

  if (error || !partner) {
    throw new Error(error?.message ?? 'Unable to create partner')
  }

  // Best effort while policies are being finalized. Ignore duplicate membership rows.
  const { error: membershipError } = await supabase.from('partner_members').insert({
    partner_id: partner.id,
    user_id: user.id,
    role: 'admin',
  })

  if (membershipError && membershipError.code !== '23505') {
    throw new Error(membershipError.message)
  }

  revalidatePath('/protected')
  redirect(`/protected/${partner.slug}`)
}

export async function updatePartnerAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const partnerId = Number(parseRequiredString(formData, 'partnerId'))
  const partnerSlug = parseRequiredString(formData, 'partnerSlug')
  const title = parseRequiredString(formData, 'title')
  const description = formData.get('description')
  const website = formData.get('website')
  const logoUrl = formData.get('logoUrl')

  const { error } = await supabase
    .from('partners')
    .update({
      title,
      description: typeof description === 'string' ? description : null,
      website: typeof website === 'string' ? website : null,
      logo_url: typeof logoUrl === 'string' ? logoUrl : null,
    })
    .eq('id', partnerId)
    .eq('slug', partnerSlug)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/protected/${partnerSlug}`)
  revalidatePath(`/protected/${partnerSlug}/settings`)
  redirect(`/protected/${partnerSlug}/settings`)
}

export async function addPartnerMemberAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const partnerId = Number(parseRequiredString(formData, 'partnerId'))
  const partnerSlug = parseRequiredString(formData, 'partnerSlug')
  const email = parseRequiredString(formData, 'email')
  const roleInput = parseRequiredString(formData, 'role').toLowerCase()
  const role = roleInput === 'admin' ? 'admin' : 'member'

  const { error } = await supabase.rpc('add_partner_member', {
    target_partner_id: partnerId,
    target_email: email,
    target_role: role,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/protected/${partnerSlug}/settings`)
  redirect(`/protected/${partnerSlug}/settings`)
}

export async function createItemAction(formData: FormData) {
  const created = await createItemDraftAction(formData)
  redirect(`/protected/${created.partnerSlug}/items/${created.itemSlug}`)
}

export async function createItemDraftAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const partnerId = Number(parseRequiredString(formData, 'partnerId'))
  const partnerSlug = parseRequiredString(formData, 'partnerSlug')
  const title = parseRequiredString(formData, 'title')
  const slugInput = formData.get('slug')
  const summary = formData.get('summary')
  const content = formData.get('content')
  const rawType = parseRequiredString(formData, 'type')
  const type = parseItemType(rawType)
  const url = parseOptionalString(formData, 'url')
  const templateZip = parseTemplateZip(formData)
  const documentationUrl = formData.get('documentationUrl')
  const normalizedDocumentationUrl =
    typeof documentationUrl === 'string' && documentationUrl.trim()
      ? documentationUrl.trim()
      : null
  const intentRaw = formData.get('intent')
  const intent = intentRaw === 'request_review' ? 'request_review' : 'save'
  const slugSource = typeof slugInput === 'string' && slugInput.trim() ? slugInput : title
  const slug = slugify(slugSource)

  ensureItemDraftConstraints({ type, slug, url, templateZip })

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      partner_id: partnerId,
      title,
      slug,
      summary: typeof summary === 'string' ? summary : null,
      content: typeof content === 'string' ? content : null,
      type,
      url: type === 'oauth' ? url : null,
      registry_item_url: null,
      documentation_url: normalizedDocumentationUrl,
      submitted_by: user.id,
    })
    .select('id, slug')
    .single()

  if (error || !item) {
    throw new Error(error?.message ?? 'Unable to create item')
  }

  if (type === 'template' && templateZip) {
    const registryItemUrl = await uploadTemplatePackage({
      zipFile: templateZip,
      supabase,
      partnerId,
      itemId: item.id,
    })
    const { error: templateUrlError } = await supabase
      .from('items')
      .update({ registry_item_url: registryItemUrl })
      .eq('id', item.id)

    if (templateUrlError) {
      throw new Error(templateUrlError.message)
    }
  }

  if (intent === 'request_review') {
    const { error: reviewError } = await supabase.from('item_reviews').upsert(
      {
        item_id: item.id,
        status: 'pending_review',
        featured: false,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        published_at: null,
      },
      { onConflict: 'item_id' }
    )

    if (reviewError) {
      throw new Error(reviewError.message)
    }
  }

  revalidatePath(`/protected/${partnerSlug}`)
  return {
    itemId: item.id,
    itemSlug: item.slug,
    partnerSlug,
  }
}

export async function updateItemAction(formData: FormData) {
  const updated = await updateItemDraftAction(formData)
  redirect(`/protected/${updated.partnerSlug}/items/${updated.itemSlug}`)
}

export async function updateItemDraftAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const itemId = Number(parseRequiredString(formData, 'itemId'))
  const partnerId = Number(parseRequiredString(formData, 'partnerId'))
  const partnerSlug = parseRequiredString(formData, 'partnerSlug')
  const name = parseRequiredString(formData, 'name')
  const slugInput = formData.get('slug')
  const summary = formData.get('summary')
  const content = formData.get('content')
  const url = parseOptionalString(formData, 'url')
  const templateZip = parseTemplateZip(formData)
  const existingRegistryItemUrl = parseOptionalString(formData, 'existingRegistryItemUrl')
  const documentationUrl = formData.get('documentationUrl')
  const normalizedDocumentationUrl =
    typeof documentationUrl === 'string' && documentationUrl.trim()
      ? documentationUrl.trim()
      : null
  const rawType = parseRequiredString(formData, 'type')
  const type = parseItemType(rawType)
  const removedFileIds = parseNumberList(formData, 'removedFileIds[]')

  const slugSource = typeof slugInput === 'string' && slugInput.trim() ? slugInput : name
  const slug = slugify(slugSource)

  ensureItemDraftConstraints({
    type,
    slug,
    url,
    templateZip,
    existingRegistryItemUrl,
  })

  const templateRegistryUrl =
    type === 'template' && templateZip
      ? await uploadTemplatePackage({
          zipFile: templateZip,
          supabase,
          partnerId,
          itemId,
        })
      : existingRegistryItemUrl

  const { data: item, error } = await supabase
    .from('items')
    .update({
      title: name,
      slug,
      summary: typeof summary === 'string' ? summary : null,
      content: typeof content === 'string' ? content : null,
      url: type === 'oauth' ? url : null,
      documentation_url: normalizedDocumentationUrl,
      type,
      registry_item_url: type === 'template' ? templateRegistryUrl : null,
    })
    .eq('id', itemId)
    .select('slug')
    .single()

  if (error || !item) {
    throw new Error(error?.message ?? 'Unable to update item')
  }

  if (removedFileIds.length > 0) {
    const { data: filesToDelete, error: filesToDeleteError } = await supabase
      .from('item_files')
      .select('id, file_path')
      .eq('item_id', itemId)
      .in('id', removedFileIds)

    if (filesToDeleteError) {
      throw new Error(filesToDeleteError.message)
    }

    if ((filesToDelete?.length ?? 0) > 0) {
      const pathsToDelete = filesToDelete.map((file: { file_path: string }) => file.file_path)
      const idsToDelete = filesToDelete.map((file: { id: number }) => file.id)

      const { error: storageDeleteError } = await supabase.storage
        .from('item_files')
        .remove(pathsToDelete)

      if (storageDeleteError) {
        throw new Error(storageDeleteError.message)
      }

      const { error: rowDeleteError } = await supabase
        .from('item_files')
        .delete()
        .eq('item_id', itemId)
        .in('id', idsToDelete)

      if (rowDeleteError) {
        throw new Error(rowDeleteError.message)
      }
    }
  }

  revalidatePath(`/protected/${partnerSlug}`)
  return {
    itemId,
    itemSlug: item.slug,
    partnerSlug,
  }
}

export async function requestItemReviewAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const itemId = Number(parseRequiredString(formData, 'itemId'))
  const itemSlug = parseRequiredString(formData, 'itemSlug')
  const partnerSlug = parseRequiredString(formData, 'partnerSlug')

  const { data: existingReview, error: existingReviewError } = await supabase
    .from('item_reviews')
    .select('status')
    .eq('item_id', itemId)
    .maybeSingle()

  if (existingReviewError) {
    throw new Error(existingReviewError.message)
  }

  if (shouldRequestReview(existingReview?.status)) {
    const { error: upsertError } = await supabase.from('item_reviews').upsert(
      {
        item_id: itemId,
        status: 'pending_review',
        featured: false,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        published_at: null,
      },
      { onConflict: 'item_id' }
    )

    if (upsertError) {
      throw new Error(upsertError.message)
    }
  }

  revalidatePath(`/protected/${partnerSlug}`)
  revalidatePath(`/protected/${partnerSlug}/items/${itemSlug}`)
  redirect(`/protected/${partnerSlug}/items/${itemSlug}`)
}

export async function updateItemReviewAction(formData: FormData) {
  const { itemId, partnerSlug } = await saveItemReviewAction(formData)
  redirect(`/protected/${partnerSlug}/reviews/${itemId}`)
}

export async function saveItemReviewAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const itemId = Number(parseRequiredString(formData, 'itemId'))
  const partnerSlug = parseRequiredString(formData, 'partnerSlug')
  const status = parseRequiredString(formData, 'status')
  const reviewNotes = formData.get('reviewNotes')
  const featured = formData.get('featured') === 'on'
  if (!isReviewStatus(status)) {
    throw new Error('Invalid review status')
  }

  const { error } = await supabase.from('item_reviews').upsert(
    {
      item_id: itemId,
      status,
      featured,
      review_notes: typeof reviewNotes === 'string' ? reviewNotes : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: 'item_id' }
  )

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/protected/${partnerSlug}/reviews`)
  revalidatePath(`/protected/${partnerSlug}/reviews/${itemId}`)
  return { itemId, partnerSlug }
}
