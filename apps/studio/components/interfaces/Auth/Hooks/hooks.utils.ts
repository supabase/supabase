import { Hook } from './hooks.constants'

export const extractMethod = (
  uri: string,
  secret?: string
):
  | { type: 'postgres'; schema: string; functionName: string }
  | { type: 'https'; url: string; secret: string } => {
  if (uri.startsWith('https')) {
    return { type: 'https', url: uri, secret: secret || '' }
  } else {
    const [_proto, _x, _db, schema, functionName] = (uri || '').split('/')

    return {
      type: 'postgres',
      schema: schema || '',
      functionName: functionName || '',
    }
  }
}

export const isValidHook = (h: Hook) => {
  return (
    (h.method.type === 'postgres' &&
      h.method.schema.length > 0 &&
      h.method.functionName.length > 0) ||
    (h.method.type === 'https' && h.method.url.startsWith('https') && h.method.secret.length > 0)
  )
}
