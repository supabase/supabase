import { pluralize } from '../utils/words'

export const capitalizedWords = new Set([
  ...pluralize('API'),
  'Firebase',
  'I',
  'JSON',
  ...pluralize('JSON Web Token'),
  ...pluralize('JWT'),
  'Next.js',
  'OAuth',
  'Postgres',
  'Supabase',
  ...pluralize('URL'),
  'WebP',
])
