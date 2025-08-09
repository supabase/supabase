export enum URL_EXPIRY_DURATION {
  WEEK = 60 * 60 * 24 * 7,
  MONTH = 60 * 60 * 24 * 30,
  YEAR = 60 * 60 * 24 * 365,
}

export enum STORAGE_VIEWS {
  COLUMNS = 'COLUMNS',
  LIST = 'LIST',
}

export enum STORAGE_SORT_BY {
  NAME = 'name',
  UPDATED_AT = 'updated_at',
  CREATED_AT = 'created_at',
  LAST_ACCESSED_AT = 'last_accessed_at',
}

export enum STORAGE_BUCKET_SORT {
  ALPHABETICAL = 'alphabetical',
  CREATED_AT = 'created_at',
}

export enum STORAGE_SORT_BY_ORDER {
  ASC = 'asc',
  DESC = 'desc',
}

export enum STORAGE_ROW_TYPES {
  BUCKET = 'BUCKET',
  FILE = 'FILE',
  FOLDER = 'FOLDER',
}

export enum STORAGE_ROW_STATUS {
  READY = 'READY',
  LOADING = 'LOADING',
  EDITING = 'EDITING',
}

export const STORAGE_CLIENT_LIBRARY_MAPPINGS = {
  upload: ['INSERT'],
  download: ['SELECT'],
  list: ['SELECT'],
  update: ['SELECT', 'UPDATE'],
  move: ['SELECT', 'UPDATE'],
  copy: ['SELECT', 'INSERT'],
  remove: ['SELECT', 'DELETE'],
  createSignedUrl: ['SELECT'],
  createSignedUrls: ['SELECT'],
  getPublicUrl: [],
}

export const CONTEXT_MENU_KEYS = {
  STORAGE_COLUMN: 'STORAGE_COLUMN',
  STORAGE_ITEM: 'STORAGE_ITEM',
  STORAGE_FOLDER: 'STORAGE_FOLDER',
}
