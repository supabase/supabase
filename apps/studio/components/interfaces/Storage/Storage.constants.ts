import { DOCS_URL } from 'lib/constants'

// Original storage constants
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

// New bucket types configuration

export const BUCKET_TYPES = {
  files: {
    displayName: 'Files',
    label: 'a file bucket',
    description: 'General file storage for most types of digital content.',
    valueProp: 'Store images, videos, documents, and any other file type.',
    docsUrl: `${DOCS_URL}/guides/storage/buckets/fundamentals`,
  },
  analytics: {
    displayName: 'Analytics',
    label: 'an analytics bucket',
    description: 'Purpose-built storage for analytical workloads.',
    valueProp: 'Store large datasets for analytics and reporting.',
    docsUrl: `${DOCS_URL}/guides/storage/analytics/introduction`,
  },
  vectors: {
    displayName: 'Vectors',
    label: 'a vector bucket',
    description: 'Purpose-built storage for vector data.',
    valueProp: 'Store, index, and query your vector embeddings at scale.',
    docsUrl: `${DOCS_URL}/guides/storage/vectors`,
  },
}
export const BUCKET_TYPE_KEYS = Object.keys(BUCKET_TYPES) as Array<keyof typeof BUCKET_TYPES>
export const DEFAULT_BUCKET_TYPE: keyof typeof BUCKET_TYPES = 'files'
