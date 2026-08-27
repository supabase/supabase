export interface IApiEndPoint {
  id: string
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  summary?: string
  description?: string
  deprecated?: boolean
  parameters: Array<{
    name: string
    required: boolean
    in: 'path' | 'query' | 'body'
    description?: string
    schema: ISchema
  }>
  requestBody?: {
    required?: boolean
    content: IApiRequestBody
  }
  responses: {
    [key: string]: {
      description: string
      content?: IApiJsonDTO
    }
  }
  tags?: Array<string>
  security?: Array<ISecurityOption>
  'x-oauth-scope'?: string
  'x-allowed-plans'?: string[]
  'x-fga-permissions'?: string[][]
}

export type ISchema =
  | ISchemaString
  | ISchemaInteger
  | ISchemaObject
  | ISchemaEnum
  | ISchemaBoolean
  | ISchemaNumber
  | ISchemaFile
  | ISchemaArray
  | ISchemaAllOf
  | ISchemaAnyOf
  | ISchemaOneOf

interface ISchemaBase {
  description?: string
  example?: unknown
  deprecated?: boolean
  nullable?: boolean
}

interface ISchemaBoolean extends ISchemaBase {
  type: 'boolean'
}

interface ISchemaInteger extends ISchemaBase {
  type: 'integer'
  minimum?: number
  maximum?: number
}

interface ISchemaNumber extends ISchemaBase {
  type: 'number'
  minimum?: number
  maximum?: number
}

interface ISchemaString extends ISchemaBase {
  type: 'string'
  minLength?: number
  maxLength?: number
  pattern?: string
}

interface ISchemaFile extends ISchemaBase {
  type: 'file'
  format?: 'binary'
}

interface ISchemaObject extends ISchemaBase {
  type: 'object'
  properties?: { [key: string]: ISchema }
  additionalProperties?: ISchema
  required?: Array<string>
}

interface ISchemaArray extends ISchemaBase {
  type: 'array'
  items: ISchema
}

interface ISchemaEnum extends ISchemaBase {
  type: string
  enum: Array<unknown>
}

interface ISchemaAllOf extends ISchemaBase {
  // Object form as well as array: some specs write a single schema here rather than a
  // one element list. Normalise with `asSchemaArray` before iterating.
  allOf: ISchema | Array<ISchema>
}

interface ISchemaAnyOf extends ISchemaBase {
  // Object form as well as array: some specs write a single schema here rather than a
  // one element list. Normalise with `asSchemaArray` before iterating.
  anyOf: ISchema | Array<ISchema>
}

interface ISchemaOneOf extends ISchemaBase {
  // Object form as well as array: some specs write a single schema here rather than a
  // one element list. Normalise with `asSchemaArray` before iterating.
  oneOf: ISchema | Array<ISchema>
}

interface IApiRequestBody extends IApiJsonDTO, IApiFormUrlEncodedDTO {}

interface IApiJsonDTO {
  'application/json'?: {
    schema: ISchema
  }
}

interface IApiFormUrlEncodedDTO {
  'application/x-www-form-urlencoded'?: {
    schema: ISchema
  }
}

type ISecurityOption = IBearerSecurity | IOAuth2Security | IFgaSecurity

interface IBearerSecurity {
  bearer: []
}

interface IOAuth2Security {
  oauth2: Array<'read' | 'write'>
}

interface IFgaSecurity {
  fga_permissions: string[]
}

// Some specs have allOf/anyOf/oneOf as a single schema object instead of an
// array. Wrap it so callers can treat both shapes the same way.
export function asSchemaArray(value: unknown): Array<any> {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  return []
}

export function getTypeDisplayFromSchema(schema: ISchema) {
  if ('allOf' in schema) {
    const options = asSchemaArray(schema.allOf)
    if (options.length === 1) {
      return getTypeDisplayFromSchema(options[0])
    } else {
      return {
        displayName: 'all of the following options',
      }
    }
  } else if ('oneOf' in schema) {
    const options = asSchemaArray(schema.oneOf)
    if (options.length === 1) {
      return getTypeDisplayFromSchema(options[0])
    } else {
      return {
        displayName: 'one of the following options',
      }
    }
  } else if ('anyOf' in schema) {
    const options = asSchemaArray(schema.anyOf)
    if (options.length === 1) {
      return getTypeDisplayFromSchema(options[0])
    } else {
      return {
        displayName: 'any of the following options',
      }
    }
  } else if ('enum' in schema) {
    return {
      displayName: 'enum',
    }
  } else if (schema.type === 'boolean') {
    return {
      displayName: 'boolean',
    }
  } else if (schema.type === 'integer') {
    return {
      displayName: 'integer',
    }
  } else if (schema.type === 'number') {
    return {
      displayName: 'number',
    }
  } else if (schema.type === 'string') {
    return {
      displayName: 'string',
    }
  } else if (schema.type === 'file') {
    return {
      displayName: 'file',
    }
  } else if (schema.type === 'array') {
    return {
      displayName: `Array<${getTypeDisplayFromSchema(schema.items).displayName}>`,
    }
  } else if (schema.type === 'object') {
    return {
      displayName: 'object',
    }
  }

  // Default fallback for unhandled schema types
  return {
    displayName: 'unknown',
  }
}
