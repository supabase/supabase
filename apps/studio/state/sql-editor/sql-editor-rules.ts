import type { UpsertContentPayload } from '@/data/content/content-upsert-mutation'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'

/**
 *
 * A snippet is read-only when it's shared to the project and you are not its
 * owner. Returns true when editing IS allowed.
 *
 */
export function canEditSnippet(
  snippet: Pick<SnippetWithContent, 'visibility' | 'owner_id'>,
  profileId?: number
): boolean {
  return !(snippet.visibility === 'project' && snippet.owner_id !== profileId)
}

export function isSnippetOwner(
  snippet: Pick<SnippetWithContent, 'owner_id'>,
  profileId?: number
): boolean {
  return profileId === snippet.owner_id
}

/**
 *
 * Shared snippets cannot live in a folder.
 *
 */
export function validateMoveToFolder({
  visibility,
  folderId,
}: {
  visibility?: SnippetWithContent['visibility']
  folderId?: string | null
}): { ok: true } | { ok: false; error: string } {
  if (visibility === 'project' && !!folderId) {
    return { ok: false, error: 'Shared snippet cannot be within a folder' }
  }
  return { ok: true }
}

export type LoadedSnippet = SnippetWithContent & {
  content: NonNullable<SnippetWithContent['content']>
}
export function isLoadedSnippet(snippet: SnippetWithContent): snippet is LoadedSnippet {
  return snippet.content != null
}

export function buildUpsertPayload(snippet: LoadedSnippet, id: string): UpsertContentPayload {
  const { name, description, visibility, project_id, owner_id, folder_id, content, favorite } =
    snippet
  return {
    id,
    type: 'sql',
    name: name ?? 'Untitled',
    description: description ?? '',
    visibility: visibility ?? 'user',
    project_id: project_id ?? 0,
    owner_id,
    folder_id: folder_id ?? undefined,
    favorite: favorite ?? false,
    content: { ...content, content_id: id },
  }
}
