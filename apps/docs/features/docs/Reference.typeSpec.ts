/**
 * Types and additional comments for the JavaScript library are found in the
 * auto-generated TS typespec.
 *
 * The format of this typespec is difficult to walk, so we re-shape it for easy
 * access to a function's type definition, given its name and module.
 */

import _typeSpec from '~/spec/enrichments/tsdoc_v2/combined.json' with { type: 'json' }

// [Charis] 2024-07-10
// Types are more trouble than they're worth here: manually defining the types
// (correctly) is tedious, and inferring them will throw up a lot of type
// errors. As long as everything is typed on the way out, and we code
// defensively, it should be fine. Keep any unsafe type shenanigans isolated
// to this file.
const typeSpec = _typeSpec as any

export const TYPESPEC_NODE_ANONYMOUS = Symbol('anonymous')

/**
 * Definitions for the methods and types defined in each Supabase JS client
 * library.
 */
export interface ModuleTypes {
  name: string
  methods: Map<string, MethodTypes>
}

/**
 * Type definitions for a method (a function).
 */
export interface MethodTypes {
  name: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  params: Array<FunctionParameterType>
  ret: ReturnType | undefined
  altSignatures?: [
    {
      params: Array<FunctionParameterType>
      ret: ReturnType | undefined
    },
  ]
}

interface Comment {
  shortText?: string
  text?: string
  tags?: Array<{ tag: string; text: string }>
}

export interface FunctionParameterType {
  name: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  isOptional?: boolean
  type: TypeDetails | undefined
}

interface ReturnType {
  type: TypeDetails | undefined
  comment?: Comment
}

export type TypeDetails = IntrinsicType | LiteralType | CustomType

/**
 * Type definition for an intrinsic (built-in) TypeScript type, for example,
 * `string`, `boolean`.
 */
interface IntrinsicType {
  type: 'intrinsic'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
}

interface LiteralType {
  type: 'literal'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
}

type CustomType =
  | NameOnlyType
  | CustomObjectType
  | CustomUnionType
  | CustomFunctionType
  | ArrayType
  | RecordType
  | IndexSignatureType
  | PromiseType

interface NameOnlyType {
  type: 'nameOnly'
  name: string | typeof TYPESPEC_NODE_ANONYMOUS
}

interface CustomObjectType {
  type: 'object'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  properties: Array<CustomTypePropertyType>
}

export interface CustomUnionType {
  type: 'union'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  subTypes: Array<TypeDetails>
}

interface CustomFunctionType {
  type: 'function'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  params: Array<FunctionParameterType>
  ret: ReturnType | undefined
}

interface ArrayType {
  type: 'array'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  elemType: TypeDetails | undefined
}

interface RecordType {
  type: 'record'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  keyType: TypeDetails | undefined
  valueType: TypeDetails | undefined
}

interface IndexSignatureType {
  type: 'index signature'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  keyType: TypeDetails | undefined
  valueType: TypeDetails | undefined
}

interface PromiseType {
  type: 'promise'
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  awaited: TypeDetails | undefined
}

/**
 * Type definition for a property on a custom type definition.
 */
export interface CustomTypePropertyType {
  name?: string | typeof TYPESPEC_NODE_ANONYMOUS
  comment?: Comment
  isOptional?: boolean
  type: TypeDetails | undefined
}

// The meaning of kind flags from `typedoc`:
// https://github.com/TypeStrong/typedoc/blob/2953b0148253589448176881a7acb46090f941bd/src/lib/output/themes/default/assets/typedoc/Application.ts#L36
const KIND_MODULE = 2
const KIND_CLASS = 128
const KIND_INTERFACE = 256
const KIND_CONSTRUCTOR = 512
const KIND_PROPERTY = 1024
const KIND_METHOD = 2048
const KIND_TYPE_LITERAL = 65536

/**
 *
 * New versions of `typedoc` added the variant property, so this is a quick and
 * dirty way of checking version.
 */
function isNewTypedoc(node: any) {
  return 'variant' in node
}

/**
 *
 * The shape of a new `typedoc` comment. `typedoc` changed their Comment class
 * in v0.23.0.
 */
interface TypedocComment {
  summary: CommentKind[]
  blockTags: CommentBlockTag[]
  /** Includes tags like `@experimental` **/
  modifierTags: string[]
}

type CommentKind = CommentKindText | CommentKindCode

interface CommentKindText {
  kind: 'text'
  text: string
}

interface CommentKindCode {
  kind: 'code'
  text: string
}

interface CommentBlockTag {
  /**
   * An @ string, e.g., `@returns`
   */
  tag: string
  content: CommentKind[]
}

function normalizeComment(original: TypedocComment | Comment | undefined): Comment | undefined {
  if (!original) return

  if ('shortText' in original || 'text' in original) {
    // This is the old comment type, just return it
    return original
  }

  const comment: Comment = {}

  if ('summary' in original) {
    comment.shortText = original.summary.map((part) => part.text).join('')
  }

  if ('modifierTags' in original) {
    comment.tags = original.modifierTags.map((tag) => ({ tag: tag.replace(/^@/, ''), text: '' }))
  }

  return comment
}

export function parseTypeSpec() {
  const modules = (typeSpec.children ?? []).map(parseMod)
  return modules as Array<ModuleTypes>
}

// Reading the type spec happens in several layers. The first layer is the
// module: this corresponds roughly to the JS libraries for each product:
// database, auth, storage, etc.

function parseMod(mod: (typeof typeSpec)['children'][number]) {
  const res: ModuleTypes = {
    name: mod.name,
    methods: new Map(),
  }

  // Build a map of nodes by their IDs for easy cross-referencing.
  const targetMap = new Map<number, any>()
  buildMap(mod, targetMap)

  parseModInternal(mod, targetMap, [], res)

  return res
}

function buildMap(node: any, map: Map<number, any>) {
  if ('id' in node) {
    map.set(node.id, node)
  }
  if ('children' in node) {
    node.children.forEach((child: any) => buildMap(child, map))
  }
}

// This layer is the top level of a module. Paths are tracked in this layer,
// because they are needed to construct the $ref that will be used to reference
// a specific type definition.

function parseModInternal(
  node: any,
  map: Map<number, any>,
  currentPath: Array<string>,
  res: ModuleTypes
) {
  let updatedPath: Array<string>

  switch ((node.kindString ?? node.variant)?.toLowerCase()) {
    case 'module':
      updatedPath = [...currentPath, node.name]
      node.children?.forEach((child: any) => parseModInternal(child, map, updatedPath, res))
      return
    // Some libraries have undefined where others have Project or declaration // for the same type of top-level node.
    case 'project':
    case undefined:
      updatedPath = [...currentPath, node.name]
      node.children?.forEach((child: any) => parseModInternal(child, map, updatedPath, res))
      return
    case 'class':
      updatedPath = [...currentPath, node.name]
      node.children?.forEach((child: any) => parseModInternal(child, map, updatedPath, res))
      return
    case 'constructor':
      return parseConstructor(node, map, currentPath, res)
    case 'method':
      return parseMethod(node, map, currentPath, res)
    case 'interface':
      updatedPath = [...currentPath, node.name]
      node.children?.forEach((child: any) => parseModInternal(child, map, updatedPath, res))
      return
    case 'declaration':
      if (node.kind === KIND_CLASS || node.kind === KIND_MODULE) {
        updatedPath = [...currentPath, node.name]
        node.children?.forEach((child: any) => parseModInternal(child, map, updatedPath, res))
      } else if (node.kind === KIND_CONSTRUCTOR) {
        parseConstructor(node, map, currentPath, res)
      } else if (node.kind === KIND_METHOD) {
        return parseMethod(node, map, currentPath, res)
      } else if (node.kind === KIND_PROPERTY) {
        if (node.type?.type === 'reference') {
          const referent = map.get(node.type.target)
          if (referent?.variant === 'declaration' && referent?.kind === KIND_INTERFACE) {
            const children = referent?.children ?? []
            updatedPath = [...currentPath, node.name]
            children.forEach((child: any) => parseModInternal(child, map, updatedPath, res))
          }
        }
      }
      return
    case 'property':
    case 'reference':
    default:
      return
  }
}

/**
 * Get the name for a node, which may be delegated or missing (placeholders
 * are prefaced by two `__` in the type spec). If missing, use the anonymous
 * symbol.
 */
function nameOrAnonymous(nodes: any) {
  if (!Array.isArray(nodes)) {
    nodes = [nodes]
  }

  for (const node of nodes) {
    if (node.name && !node.name.startsWith('__')) {
      return node.name
    }
  }

  return TYPESPEC_NODE_ANONYMOUS
}

function parseConstructor(
  node: any,
  map: Map<number, any>,
  currentPath: Array<string>,
  res: ModuleTypes
) {
  const $ref = `${currentPath.join('.')}.constructor`

  const signature = node.signatures[0]
  if (!signature) return

  const { params, ret, comment } = parseSignature(signature, map)

  const types: MethodTypes = {
    name: $ref,
    params,
    ret,
    comment,
  }

  res.methods.set($ref, types)
}

function parseMethod(
  node: any,
  map: Map<number, any>,
  currentPath: Array<string>,
  res: ModuleTypes
) {
  const $ref = `${currentPath.join('.')}.${node.name}`

  const signature = node.signatures[0]
  if (!signature) return

  const { params, ret, comment } = parseSignature(signature, map)

  const types: MethodTypes = {
    name: $ref,
    params,
    ret,
    comment,
  }

  if (node.signatures.length > 1) {
    types.altSignatures = node.signatures
      .slice(1)
      .map((signature) => parseSignature(signature, map))
  }

  res.methods.set($ref, types)
}

function parseSignature(
  signature: any,
  map: Map<number, any>
): {
  params: Array<FunctionParameterType>
  ret: ReturnType | undefined
  comment?: Comment
} {
  const params: Array<FunctionParameterType> = (signature.parameters ?? []).map((param: any) => {
    const type = parseType(param.type, map)

    const res: FunctionParameterType = {
      name: nameOrAnonymous(param),
      type,
    }

    if (param.flags?.isOptional) {
      res.isOptional = true
    }

    if (param.comment) {
      res.comment = normalizeComment(param.comment)
    }

    return res
  })

  let ret: ReturnType | undefined
  if ('type' in signature) {
    const retType = parseType(signature.type, map)
    if (retType) {
      ret = {
        type: retType,
      }
    }
  }

  return {
    params,
    ret,
    comment: normalizeComment(signature.comment),
  }
}

// This layer parses type definitions from the original typespec: these have
// the format:
//
// ```
// "type": {
//   "type": string,
//   "name": string
// }
// ```
//
// with additional properties depending on the type.

function parseType(type: any, map: Map<number, any>, typeArguments?: any, debug = false) {
  switch (type.type) {
    case 'literal':
      return type
    case 'intrinsic':
      return type
    case 'reference':
      return parseReferenceType(type, map, typeArguments, debug)
    case 'array':
      return parseArrayType(type, map, typeArguments, debug)
    case 'union':
      return parseUnionType(type, map, typeArguments, debug)
    case 'reflection':
      return parseReflectionType(type, map, typeArguments, debug)
    case 'indexedAccess':
      return parseIndexedAccessType(type, map, typeArguments, debug)
    case 'typeOperator':
      return parseTypeOperatorType(type, map, typeArguments, debug)
    case 'conditional':
      return parseConditionalType(type, map, typeArguments, debug)
    default:
      break
  }

  // Some nested types are wrapped in a kind node
  switch (type.kindString) {
    case 'Type alias':
      if (typeof type.type === 'object') {
        return parseType(type.type, map)
      }
    case 'Interface':
      return parseInterface(type, map)
    default:
      break
  }

  return undefined
}

/**
 * For a type that aliases its type definition to another node, delegate
 * parsing to the referenced node, but use the name and comment from the
 * original type.
 */
function delegateParsing(
  original: any,
  referenced: any,
  map: Map<number, any>,
  typeArguments?: any
) {
  const dereferencedType = parseType(referenced, map, typeArguments)

  if (dereferencedType) {
    dereferencedType.name = nameOrAnonymous([original, dereferencedType])
  }

  if (original.comment) {
    dereferencedType.comment = {
      ...normalizeComment(dereferencedType.comment),
      ...normalizeComment(original.comment),
    }
  }

  return dereferencedType
}

function parseConditionalType(
  type: any,
  map: Map<number, any>,
  typeArguments?: any,
  _debug = false
) {
  if (type.extendsType?.type === 'intrinsic' && type.extendsType?.name === 'object') {
    let properties = []

    if (
      type.trueType?.type === 'mapped' &&
      type.trueType?.parameterType?.target?.refersToTypeParameter &&
      typeArguments?.[0]
    ) {
      const propertyNames = parseType(typeArguments?.[0], map).properties?.map((p) => p.name)
      properties = (propertyNames ?? [])
        .map((p: string) => {
          if (!type.trueType?.templateType) return undefined

          const mappedType = parseType(type.trueType.templateType, map)
          if (mappedType) {
            return {
              name: p,
              type: mappedType,
            }
          }
        })
        .filter(Boolean)
    }

    return {
      type: 'object',
      properties,
    }
  }
}

function parseReferenceType(type: any, map: Map<number, any>, typeArguments?: any, debug = false) {
  if (type.dereferenced?.type) {
    return delegateParsing(type, type.dereferenced.type, map)
  }

  if (type.dereferenced?.kindString) {
    return delegateParsing(type, type.dereferenced, map)
  }

  if (type.refersToTypeParameter === true && typeArguments?.[0]) {
    return delegateParsing(type, typeArguments?.[0], map)
  }

  if (
    type.package === 'typescript' &&
    (type.name === 'Record' || type.qualifiedName === 'Record')
  ) {
    return parseRecordType(type, map)
  }

  if (
    type.package === 'typescript' &&
    (type.name === 'Promise' || type.qualifiedName === 'Promise')
  ) {
    return parsePromiseType(type, map)
  }

  if (
    type.package === 'typescript' &&
    (type.name === 'Extract' || type.qualifiedName === 'Extract')
  ) {
    return parseExtractType(type, map)
  }

  if (type.package === 'typescript' && (type.name === 'Pick' || type.qualifiedName === 'Pick')) {
    return parsePickType(type, map)
  }

  // If we still haven't produced a meaningful type, try looking up the reference
  const referenced = map.get(type.id ?? type.target) // became target in newer versions of tsdoc
  if (referenced) {
    const maybeType =
      typeof referenced.type === 'object' && 'type' in referenced.type
        ? /* need to go down a level */ delegateParsing(
            type,
            referenced.type,
            map,
            type.typeArguments
          )
        : delegateParsing(type, referenced, map, type.typeArguments)

    if (maybeType) {
      return maybeType
    } else if (isNewTypedoc(referenced) && referenced.kind === KIND_INTERFACE) {
      return parseInterface(referenced, map)
    } else if (isNewTypedoc(referenced) && referenced.kind === KIND_CLASS) {
      // Class is too complicated to display here, just return its name
      return {
        type: 'nameOnly',
        name: referenced.name,
      }
    }
  }

  // We produced nothing, let's just return some strings in case they're in any
  // way meaningful.
  if (type.package && type.qualifiedName) {
    return {
      type: 'nameOnly',
      name:
        type.package === 'typescript'
          ? type.qualifiedName
          : `${type.package}.${type.qualifiedName}`,
    }
  }

  if (type.name === 'default' && type.typeArguments?.[0]) {
    return parseType(type.typeArguments[0], map)
  }

  // Final fallback
  if (type.name && type.name !== 'default' /* Not particularly meaningful */) {
    return {
      type: 'nameOnly',
      name: type.name,
    }
  }

  return undefined
}

function parseArrayType(
  type: any,
  map: Map<number, any>,
  _typeArguments?: any,
  debug = false
): ArrayType {
  const elemType = parseType(type.elementType, map)

  return {
    type: 'array',
    name: nameOrAnonymous(type),
    elemType,
  }
}

function parseUnionType(
  type: any,
  map: Map<number, any>,
  typeArguments?: any,
  _debug = false
): CustomUnionType {
  // Need the Boolean filter because there are nulls in some of the nodes
  const subTypes = type.types.filter(Boolean).map((type) => parseType(type, map, typeArguments))

  return {
    type: 'union',
    name: nameOrAnonymous(type),
    subTypes,
  }
}

function parseRecordType(type: any, map: Map<number, any>): RecordType {
  const [keyType, valueType] = (type.typeArguments ?? []).map((type) => parseType(type, map))

  return {
    type: 'record',
    name: nameOrAnonymous(type),
    keyType,
    valueType,
  }
}

function parsePromiseType(type: any, map: Map<number, any>): PromiseType {
  return {
    type: 'promise',
    name: nameOrAnonymous(type),
    awaited: type.typeArguments?.[0] ? parseType(type.typeArguments[0], map) : undefined,
  }
}

function parseExtractType(type: any, map: Map<number, any>): CustomUnionType {
  const extractedUnion = parseUnionType(type.typeArguments[1], map)
  return extractedUnion
}

function parsePickType(type: any, map: Map<number, any>) {
  if (type.typeArguments[0].type === 'reference') {
    const dereferencedNode = map.get(type.typeArguments[0].id)
    if (!dereferencedNode) return undefined
    const dereferencedType = parseType(dereferencedNode, map)
    if (!dereferencedType?.properties) return undefined

    switch (type.typeArguments[1].type) {
      case 'literal':
        return dereferencedType.properties.find(
          (property) => property.name === type.typeArguments[1].value
        )
      case 'union':
      default:
        const subTypes = dereferencedType.properties.filter((property) =>
          type.typeArguments[1].types.some((type) => type.value === property.name)
        )
        if (subTypes.length === 0) return undefined

        return {
          type: 'union',
          subTypes,
        }
    }
  }

  return undefined
}

function parseReflectionType(
  type: any,
  map: Map<number, any>,
  typeArguments?: any,
  _debug = false
): TypeDetails | undefined {
  if (!type.declaration) return undefined

  let res: TypeDetails | undefined
  switch ((type.declaration.kindString ?? type.declaration.variant).toLowerCase()) {
    case 'type literal':
      res = parseTypeLiteral(type, map, typeArguments)
      break
    case 'declaration':
      if (type.declaration.kind === KIND_TYPE_LITERAL) {
        res = parseTypeLiteral(type, map, typeArguments)
      }
    default:
      break
  }

  return res
}

function parseTypeLiteral(
  type: any,
  map: Map<number, any>,
  typeArguments?: any
): TypeDetails | undefined {
  const name = nameOrAnonymous(type)

  if ('children' in type.declaration) {
    const properties = type.declaration.children
      .map((child: any) => parseTypeInternals(child, map, typeArguments))
      .filter(Boolean)
    return {
      name,
      type: 'object',
      properties,
    } satisfies CustomObjectType
  }

  if ('signatures' in type.declaration && type.declaration.signatures[0]) {
    const { params, ret, comment } = parseSignature(type.declaration.signatures[0], map)
    return {
      name,
      type: 'function',
      params,
      ret,
      comment,
    }
  }

  if ('indexSignature' in type.declaration || 'indexSignatures' in type.declaration) {
    const signature = type.declaration.indexSignature ?? type.declaration.indexSignatures[0]

    return {
      name,
      type: 'index signature',
      keyType: signature.parameters?.[0]
        ? parseType(signature.parameters?.[0].type, map)
        : undefined,
      valueType: signature.type ? parseType(signature.type, map) : undefined,
    }
  }

  return undefined
}

function parseIndexedAccessType(
  type: any,
  map: Map<number, any>,
  _typeArguments?: any,
  _debug = false
) {
  return {
    type: 'nameOnly',
    name: `${type.objectType?.name ?? ''}['${type.indexType.value ?? type.indexType.name ?? ''}']`,
  }
}

function parseTypeOperatorType(
  type: any,
  map: Map<number, any>,
  _typeArguments?: any,
  _debug = false
) {
  switch (type.operator) {
    case 'readonly':
      return parseType(type.target, map)
    default:
      return undefined
  }
}

function parseInterface(type: any, map: Map<number, any>): CustomObjectType {
  const properties = (type.children ?? [])
    .map((child) => parseTypeInternals(child, map))
    .filter(Boolean)

  return {
    type: 'object',
    name: nameOrAnonymous(type),
    properties,
  }
}

// This layer is for the sub-types that define a custom type, for example, the
// properties of an interface.

function parseTypeInternals(elem: any, map: Map<number, any>, typeArguments?: any) {
  switch ((elem.kindString || elem.variant).toLowerCase()) {
    case 'property':
    case 'declaration':
      return parseInternalProperty(elem, map, typeArguments)
    case 'method':
      if (elem.signatures?.[0]) {
        const { params, ret, comment } = parseSignature(elem.signatures?.[0], map)
        const res = {
          type: 'function',
          name: nameOrAnonymous(elem),
          params,
          ret,
          comment,
        } as CustomFunctionType

        if (elem.comment) {
          res.comment = { ...normalizeComment(res.comment), ...normalizeComment(elem.comment) }
        }

        return res
      }
    default:
      return undefined
  }
}

function parseInternalProperty(elem: any, map: Map<number, any>, typeArguments?: any) {
  const name = nameOrAnonymous(elem)
  if (!elem.type) {
    return undefined
  }

  const type = parseType(elem.type, map, typeArguments)

  const res = {
    name,
    type,
  } as CustomTypePropertyType

  if (elem.flags?.isOptional) {
    res.isOptional = true
  }

  if (elem.comment) {
    res.comment = normalizeComment(elem.comment)
  }

  return res
}
