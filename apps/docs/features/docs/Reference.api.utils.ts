export interface IApiEndPoint {
  id: string
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  summary?: string
  description?: string
  parameters: Array<{
    name: string
    required: boolean
    in: 'path' | 'query' | 'body'
    description?: string
    schema: ISchema
  }>
  requestBody?: {
    required: boolean
    content: IApiJsonDTO | IApiFormUrlEncodedDTO
  }
  responses: {
    [key: string]: {
      description: string
      content?: IApiJsonDTO
    }
  }
  tags?: Array<string>
  security?: Array<ISecurityOption>
}

type ISchema =
  | ISchemaString
  | ISchemaInteger
  | ISchemaObject
  | ISchemaEnum
  | ISchemaBoolean
  | ISchemaNumber
  | ISchemaArray

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

interface ISchemaObject extends ISchemaBase {
  type: 'object'
  properties: { [key: string]: ISchema }
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
  allOf: Array<ISchema>
}

interface ISchemaAnyOf extends ISchemaBase {
  anyOf: Array<ISchema>
}

interface ISchemaOneOf extends ISchemaBase {
  oneOf: Array<ISchema>
}

interface IApiJsonDTO {
  'application/json': {
    schema: ISchema
  }
}

interface IApiFormUrlEncodedDTO {
  'application/x-www-form-urlencoded': {
    schema: ISchema
  }
}

type ISecurityOption = IBearerSecurity | IOAuth2Security

interface IBearerSecurity {
  bearer: []
}

interface IOAuth2Security {
  oauth2: Array<'read' | 'write'>
}
