import type { TypeDetails, MethodTypes, CustomTypePropertyType } from './Reference.typeSpec'
import { FnParameterDetails, ReturnTypeDetails } from './Reference.ui'

// ---------------------------------------------------------------------------
// Processed.json types
// ---------------------------------------------------------------------------

interface ProcessedProperty {
  name: string
  optional?: boolean
  description?: string
  type: ProcessedType
}

type ProcessedType =
  | string
  | { kind: 'reference'; name: string; typeArguments?: ProcessedType[] }
  | { kind: 'object'; name?: string; properties: ProcessedProperty[] }
  | { kind: 'array'; elementType: ProcessedType }
  | { kind: 'union'; types: ProcessedType[] }
  | { kind: 'intersection'; types: ProcessedType[] }
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'conditional' }
  | { kind: 'typeParam'; name: string }

interface ProcessedParam {
  name: string
  optional?: boolean
  description?: string
  type: ProcessedType
}

// ---------------------------------------------------------------------------
// Adapter: ProcessedType → TypeDetails (TypeSpec format)
// ---------------------------------------------------------------------------

function typeNameStr(pt: ProcessedType): string {
  if (typeof pt === 'string') return pt
  switch (pt.kind) {
    case 'reference': {
      if (!pt.typeArguments?.length) return pt.name
      // Omit type arguments that are all unresolved generic placeholders
      const resolvedArgs = pt.typeArguments.filter(
        (a) => typeof a === 'string' || a.kind !== 'typeParam'
      )
      if (!resolvedArgs.length) return pt.name
      return `${pt.name}<${resolvedArgs.map(typeNameStr).join(', ')}>`
    }
    case 'object':
      return pt.name ?? 'object'
    case 'array':
      return `${typeNameStr(pt.elementType)}[]`
    case 'union':
      return pt.types.map(typeNameStr).join(' | ')
    case 'intersection':
      return pt.types.map(typeNameStr).join(' & ')
    case 'literal':
      return pt.value === null ? 'null' : String(pt.value)
    case 'conditional':
      return 'conditional'
    case 'typeParam':
      return pt.name
  }
}

function adaptProperty(p: ProcessedProperty): CustomTypePropertyType {
  return {
    name: p.name,
    // Only pass isOptional when true so the component shows "Optional" badge only;
    // omitting it entirely suppresses the "Required" badge for non-optional fields.
    ...(p.optional === true ? { isOptional: true } : {}),
    comment: p.description ? { shortText: p.description } : undefined,
    type: adaptType(p.type),
  }
}

function adaptType(pt: ProcessedType | null | undefined): TypeDetails {
  if (!pt) return { type: 'intrinsic', name: 'unknown' }
  if (typeof pt === 'string') return { type: 'intrinsic', name: pt }

  switch (pt.kind) {
    case 'reference': {
      // Promise<T> → PromiseType so getSubDetails can recursively expand T
      if (pt.name === 'Promise' && pt.typeArguments?.[0]) {
        return { type: 'promise', name: 'Promise', awaited: adaptType(pt.typeArguments[0]) }
      }
      // Other generic references: show as intrinsic name string
      return { type: 'intrinsic', name: typeNameStr(pt) }
    }
    case 'object':
      return {
        type: 'object',
        ...(pt.name ? { name: pt.name } : {}),
        properties: (pt.properties ?? []).map(adaptProperty),
      }
    case 'array':
      return { type: 'array', elemType: adaptType(pt.elementType) }
    case 'union':
      return { type: 'union', subTypes: pt.types.map(adaptType) }
    case 'intersection':
      // No TypeSpec equivalent; flatten to readable string
      return { type: 'intrinsic', name: typeNameStr(pt) }
    case 'literal':
      // getTypeName checks `'value' in type`, not `name`, for literals
      return { type: 'literal', value: pt.value } as unknown as TypeDetails
    case 'conditional':
      return { type: 'intrinsic', name: 'conditional' }
    case 'typeParam':
      return { type: 'intrinsic', name: pt.name }
  }
}

function adaptReturnType(pt: ProcessedType | null | undefined): MethodTypes['ret'] {
  return { type: adaptType(pt), comment: undefined }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function RefDefinitionParams({ parameters }: { parameters: ProcessedParam[] }) {
  if (!parameters?.length) return null
  const adapted = parameters.map((p) => ({
    ...p,
    ...(p.optional === true ? { isOptional: true } : {}),
    type: adaptType(p.type),
  }))
  return <FnParameterDetails parameters={adapted} className="max-w-[80ch]" />
}

export function RefDefinitionReturnType({ returnType }: { returnType: ProcessedType }) {
  if (!returnType) return null
  return <ReturnTypeDetails returnType={adaptReturnType(returnType)} />
}
