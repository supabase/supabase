import type { User } from '@supabase/supabase-js'
import { photos } from './collections'
import { supabase, type Wall } from './supabase'

// Walls and memberships are one-off setup calls, so they use supabase-js
// directly. Photos, which change live, go through the TanStack DB collection.

let sessionUser: Promise<User> | null = null

/**
 * Signs in anonymously when there is no session, so the app works without a
 * login. Shared, so concurrent callers (such as React StrictMode running an
 * effect twice) never create two anonymous users.
 */
export function ensureSession(): Promise<User> {
  sessionUser ??= (async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) return data.session.user
    const { data: signIn, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return signIn.user!
  })().catch((error) => {
    sessionUser = null
    throw error
  })
  return sessionUser
}

/** Opens the wall in the URL (joining it if needed), else the user's latest wall, else a new one. */
async function loadWall(wallIdFromUrl: string | null): Promise<Wall> {
  if (wallIdFromUrl) {
    const { error: joinError } = await supabase
      .from('wall_members')
      .upsert({ wall_id: wallIdFromUrl }, { onConflict: 'wall_id,user_id', ignoreDuplicates: true })
    if (joinError) throw joinError
    const { data, error } = await supabase
      .from('walls')
      .select('id, name')
      .eq('id', wallIdFromUrl)
      .single()
    if (error) throw error
    return data
  }

  const { data: existing, error: listError } = await supabase
    .from('walls')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(1)
  if (listError) throw listError
  if (existing.length > 0) return existing[0]

  const { data: wall, error } = await supabase
    .from('walls')
    .insert({ name: 'Our photo wall' })
    .select('id, name')
    .single()
  if (error) throw error
  return wall
}

let openingWall: Promise<Wall> | null = null

/** Shared for the same reason as ensureSession: one wall per page load, even under StrictMode. */
export function openWall(wallIdFromUrl: string | null): Promise<Wall> {
  openingWall ??= loadWall(wallIdFromUrl).catch((error) => {
    openingWall = null
    throw error
  })
  return openingWall
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Uploads a file to Storage under `<wall id>/`, then adds its row. The row is
 * inserted through the collection, so it shows up for everyone on the wall.
 */
export async function uploadPhoto(wallId: string, userId: string, file: Blob) {
  const extension = EXTENSIONS[file.type]
  if (!extension) throw new Error('Use a JPEG, PNG, WebP or GIF image.')
  if (file.size > MAX_FILE_SIZE) throw new Error('Photos can be up to 5 MB.')

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  bitmap.close()

  const id = crypto.randomUUID()
  const path = `${wallId}/${id}.${extension}`
  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw error

  const transaction = photos.insert({
    id,
    wall_id: wallId,
    path,
    caption: null,
    width,
    height,
    created_by: userId,
    created_at: new Date().toISOString(),
  })
  try {
    await transaction.isPersisted.promise
  } catch (insertError) {
    // The row was rejected: don't leave the uploaded file behind.
    await supabase.storage.from('photos').remove([path])
    throw insertError
  }
}

/** Deletes a photo's file and row (both are limited to the uploader by RLS). */
export async function deletePhoto(id: string, path: string) {
  // Delete the file first, and only remove the row once Storage confirms the
  // file is gone, so a photo never outlives its row at a public URL.
  const { data, error } = await supabase.storage.from('photos').remove([path])
  if (error) throw error
  if (data.length === 0) throw new Error('Could not delete the photo file. Try again.')
  await photos.delete(id).isPersisted.promise
}

/**
 * Draws a few colorful placeholder images in a canvas, so an empty wall can
 * be filled without any files at hand. They go through the same upload path.
 */
export async function createSamplePhotos(count = 6): Promise<Blob[]> {
  const sizes = [
    [1200, 900],
    [900, 1200],
    [1200, 1200],
    [1200, 800],
    [800, 1100],
    [1100, 1100],
  ]
  return Promise.all(
    Array.from({ length: count }, (_, index) => {
      const [width, height] = sizes[index % sizes.length]
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')!
      const hue = (index * 57 + 140) % 360
      const gradient = context.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, `hsl(${hue} 70% 62%)`)
      gradient.addColorStop(1, `hsl(${(hue + 60) % 360} 65% 38%)`)
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
      for (let i = 0; i < 5; i++) {
        context.fillStyle = `hsl(${(hue + i * 30) % 360} 80% 85% / 0.18)`
        context.beginPath()
        context.arc(
          ((i * 0.37 + index * 0.11) % 1) * width,
          ((i * 0.53 + index * 0.23) % 1) * height,
          (0.15 + ((i * 0.13) % 0.25)) * Math.min(width, height),
          0,
          Math.PI * 2
        )
        context.fill()
      }
      return new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Could not draw sample photo'))),
          'image/webp',
          0.85
        )
      )
    })
  )
}
