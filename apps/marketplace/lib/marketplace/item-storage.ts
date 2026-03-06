export const MARKETPLACE_DRAFT_STORAGE_BUCKET = 'item_files'
export const MARKETPLACE_PUBLIC_STORAGE_BUCKET = 'public_item_files'

export function getItemFilesStoragePath(partnerId: number | string, itemId: number | string) {
  return `${partnerId}/items/${itemId}/files`
}

export function getItemTemplateStoragePath(partnerId: number | string, itemId: number | string) {
  return `${partnerId}/items/${itemId}/template`
}

export function getItemTemplateRegistryFilePath(partnerId: number | string, itemId: number | string) {
  return `${getItemTemplateStoragePath(partnerId, itemId)}/template.json`
}
