export const STORAGE_VIEWS = {
  COLUMNS: 'COLUMNS',
  LIST: 'LIST',
}

export const STORAGE_SORT_BY = {
  NAME: 'name',
  UPDATED_AT: 'updated_at',
  CREATED_AT: 'created_at',
  LAST_ACCESSED_AT: 'last_accessed_at',
}

export const STORAGE_ROW_TYPES = {
  BUCKET: 'BUCKET',
  FILE: 'FILE',
  FOLDER: 'FOLDER',
}

export const STORAGE_ROW_STATUS = {
  READY: 'READY',
  LOADING: 'LOADING',
  EDITING: 'EDITING',
}

export const STORAGE_POLICY_DEFAULT_DEFINITION_PLACEHOLDER = `/*
  Example: Apply this policy to all authenticated users
  for a folder called 'public'

  storage.foldername(name))[[1]] = 'public'
  and auth.role() = 'authenticated'
*/

`

export const STORAGE_CLIENT_LIBRARY_MAPPINGS = {
  copyObject: ['INSERT'],
  createObject: ['INSERT'],
  deleteObject: ['SELECT', 'DELETE'],
  deleteObjects: ['SELECT', 'DELETE'],
  getObject: ['SELECT'],
  getSignedObject: [],
  getSignedUrl: ['SELECT'],
  listObjects: ['SELECT'],
  moveObjects: ['SELECT', 'UPDATE'],
  updateObject: ['SELECT', 'UPDATE'],
}

export const CONTEXT_MENU_KEYS = {
  STORAGE_COLUMN: 'STORAGE_COLUMN',
  STORAGE_ITEM: 'STORAGE_ITEM',
  STORAGE_FOLDER: 'STORAGE_FOLDER',
}
