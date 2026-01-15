import { z } from 'zod'
import { NEW_NAMESPACE_MARKER } from './CreateTableSheet.constants'

const getValidRegex = (type: 'namespace' | 'table') =>
  type === 'namespace'
    ? /^(?!aws)[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/
    : /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/
const getErrorRegex = (type: 'namespace' | 'table') =>
  type === 'namespace'
    ? /^(?:(?<starts_with_reserved>aws.*)|(?<invalid_start>[^a-z0-9].*)|(?<invalid_char>.*[^a-z0-9_].*)|(?<invalid_end>.*[^a-z0-9]))$/
    : /^(?:(?<invalid_start>[^a-z0-9].*)|(?<invalid_char>.*[^a-z0-9_].*)|(?<invalid_end>.*[^a-z0-9]))$/

const validateName = ({ name, type }: { name: string; type: 'namespace' | 'table' }) => {
  const validRe = getValidRegex(type)
  if (validRe.test(name)) return undefined

  const errorRe = getErrorRegex(type)
  const match = name.match(errorRe)?.groups || {}
  if (match.starts_with_reserved) return "Namespace must not start with 'aws'"
  if (match.invalid_start) return 'Name must begin with a lowercase letter or number'
  if (match.invalid_end) return 'Name must end with a lowercase letter or number'
  if (match.invalid_char) return 'Name may only contain lowercase letters, numbers, and underscores'

  return 'Invalid name'
}

export const createFormSchema = () =>
  z
    .object({
      namespace: z.string().min(1, 'Please select a namespace'),
      newNamespace: z.string().max(255, 'Name must be within 255 characters').optional(),
      name: z
        .string()
        .min(1, 'Provide a name for your table')
        .max(255, 'Name must be within 255 characters'),
      columns: z
        .object({
          name: z.string().min(1, 'Provide a name for your column'),
          type: z.string().min(1, 'Select a type for your column'),
          // For decimal type
          precision: z.number().optional(),
          scale: z.number().int().optional(),
          // For fixed type
          length: z.number().int().optional(),
        })
        .array()
        .default([]),
    })
    .superRefine((data, ctx) => {
      if (data.namespace === NEW_NAMESPACE_MARKER) {
        if (data.newNamespace) {
          const newNamespaceError = validateName({
            name: data.newNamespace,
            type: 'namespace',
          })
          if (newNamespaceError) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: newNamespaceError,
              path: ['newNamespace'],
            })
          }
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Provide a name for your new namespace',
            path: ['newNamespace'],
          })
        }
      }

      if (data.name) {
        const newTableError = validateName({ name: data.name, type: 'table' })
        if (newTableError) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: newTableError,
            path: ['name'],
          })
        }
      }
    })
