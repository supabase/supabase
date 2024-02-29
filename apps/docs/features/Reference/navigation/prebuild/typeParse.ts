/**
 * Functions for parsing the `tsdoc` spec.
 *
 * Use these to parse the spec when generating displayable type information.
 */

/**
 * Types and type helpers
 */

/**
 * A node with typing information.
 *
 * May be nested with additional params within.
 */
type ParamAtom = {
  name?: string
  comment?: unknown
  defaultValue?: unknown
  type: {
    type?: string
    name?: string
    value?: unknown
    dereferenced?: Dereferenced
    declaration?: Omit<ParamAtom, 'kindString'> & Pick<Required<ParamAtom>, 'kindString'>
    typeArguments?: ParamAtom['type']
  }
  kindString?: string
  indexSignature?: SignatureParam
  children?: Array<ParamAtom>
  flags?: {
    isOptional?: boolean
    isRest?: boolean
  }
}

type Dereferenced = string | object | ParsedAtom

function isParseable(unknown: string | object | ParsedAtom): unknown is ParsedAtom {
  return typeof unknown !== 'string' && 'type' in unknown
}

function isParseableWithName(
  unknown: string | object | ParsedAtom
): unknown is ParsedAtom & { name: string } {
  return isParseable(unknown) && 'name' in unknown
}

type ArrayParam = Omit<ParamAtom, 'type'> & {
  type: { type: 'array'; elementType: ParamAtom['type'] }
}

type SignatureParam = ParamAtom & {
  parameters: Array<ParamAtom>
}

type TypeOperatorParam = ParamAtom & {
  type: {
    type: 'typeOperator'
    operator: string
    target: ParamAtom['type']
  }
}

type UnionParam = Omit<ParamAtom, 'type'> & { type: { type: 'union'; types: Array<ParamAtom> } }

type TypeParameter = Omit<ParamAtom, 'type'> & {
  type?: ParamAtom['type']
  default?: ParamAtom['type']
}

type ParentAtom = {
  typeParameter?: Array<TypeParameter>
  /**
   * The chain of ancestor params must always be trackable back to the origin
   * parent, because that is the only node with the `typeParameter`, which often
   * needs to be read in a deeper node.
   */
  parent?: ParentAtom
}

/**
 * The parsed types contain the final parsed shapes of the type defs.
 */
type ParsedAtom = {
  name?: string
  type: {
    type: string
  }
  comment: unknown
  defaultValue: unknown
  optional: boolean
}

type ParsedArrayNode = ParsedAtom & { type: { type: 'array'; elementType: ParsedAtom } }

type ParsedInterfaceNode = ParsedAtom & {
  type: { type: 'interface'; properties: Array<ParsedAtom> }
}

type ParsedIndexObjectNode = ParsedAtom & {
  type: { type: 'indexedObject'; indexes: Array<ParsedNode>; value: ParsedNode }
}

type ParsedCallSignatureNode = ParsedAtom & {
  type: { type: 'functionSignature'; parameters: Array<ParsedNode>; returns: ParsedNode }
}

type ParsedSignatureNode = ParsedAtom & {
  type: { type: 'function'; signatures: Array<ParsedCallSignatureNode> }
}

type ParsedIntrinsicNode = ParsedAtom & { type: { type: string } }

type ParsedLiteralNode = ParsedAtom & { type: { type: 'literal'; value: unknown } }

type ParsedUnionNode = ParsedAtom & { type: { type: 'union'; types: Array<ParsedNode> } }

type ParsedUndefinedReferenceNode = ParsedAtom & {
  type: { type: 'reference' }
  typeArguments?: Array<ParsedNode>
}

type ParsedTypeParamNode = ParsedAtom & {
  type: { type: 'typeParamDefault'; innerType: ParsedNode }
}

type ParsedReadOnlyNode = ParsedAtom & {
  type: { type: `readonly ${string}`; innerType: ParsedNode }
}

type ParsedNode =
  | ParsedArrayNode
  | ParsedInterfaceNode
  | ParsedIndexObjectNode
  | ParsedSignatureNode
  | ParsedIntrinsicNode
  | ParsedUnionNode
  | ParsedReadOnlyNode

/**
 * Passed along for logging purposes
 */
type FnRef = string

function getCommonParamValues(param: ParamAtom) {
  return {
    // __type is an internal marker and not useful for display
    ...(param.name && param.name !== '__type' && { name: param.name }),
    ...(param.comment && { comment: param.comment }),
    ...(param.defaultValue && { defaultValue: param.defaultValue }),
    ...(param.flags?.isOptional && { optional: param.flags?.isOptional }),
  }
}

function hasTypeParameter(parent: ParentAtom) {
  let curr = parent
  while (curr) {
    if ('typeParameter' in curr) return true
    curr = curr.parent
  }
  return false
}

function getTypeParameters(
  parent: ParentAtom
): [Array<TypeParameter>, ParentAtom] | [undefined, undefined] {
  let curr = parent
  while (curr) {
    if ('typeParameter' in curr) return [curr.typeParameter, curr]
    curr = curr.parent
  }
  return [undefined, undefined]
}

function hasParseableDereferenced(param: ParamAtom) {
  return (
    typeof param.type === 'object' &&
    !!param.type.dereferenced &&
    isParseable(param.type.dereferenced)
  )
}

function parseArrayType(param: ArrayParam, parent: ParentAtom, fnRef: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: 'array',
      elementType:
        typeof param.type.elementType.type === 'string'
          ? parseParam(
              param.type.elementType.type,
              { type: param.type.elementType },
              { ...param, parent },
              fnRef
            )
          : undefined, // All cases seen so far have a string in this position
    },
  } satisfies ParsedArrayNode
}

function parseInterfaceType(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  if (!param.children) return undefined

  return {
    ...getCommonParamValues(param),
    type: {
      type: 'interface',
      properties: param.children
        .filter(isParseable)
        .map((child) => parseParam(child.type.type, child, { ...param, parent }, fnRef)),
    },
  } satisfies ParsedInterfaceNode
}

function parseTypeParameter(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  if (!isParseableWithName(param.type)) return undefined

  const [typeParameters, ancestor] = getTypeParameters(parent)
  // @ts-ignore -- param.type.name checked above
  const typeParam = typeParameters.find((some) => some.name === param.type.name)

  if (isParseable(typeParam)) {
    return {
      ...parseParam(typeParam.type.type, typeParam, ancestor, fnRef),
      ...getCommonParamValues(param),
    } satisfies ParsedNode
  }

  if (
    'default' in typeParam &&
    isParseable(typeParam.default) &&
    typeof typeParam.default.type === 'string'
  ) {
    const parsedDefault = parseParam(
      typeParam.default.type,
      { type: typeParam.default },
      ancestor,
      fnRef
    )

    return {
      ...getCommonParamValues(param),
      type: {
        type: 'typeParamDefault',
        innerType: parsedDefault,
      },
    } satisfies ParsedTypeParamNode
  }

  return undefined
}

function parseDereferenced(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  if (!isParseable(parent)) return undefined

  return (
    (isParseable(param) && parseParam(param.type.type, param, parent, fnRef)) ||
    (param.kindString === 'Interface' && parseInterfaceType(param, parent, fnRef))
  )
}

function parseReferenceType(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  return (
    (hasTypeParameter(parent) && parseTypeParameter(param, parent, fnRef)) ||
    // @ts-ignore -- param.type.dereferenced is checked by hasParseableDereferenced
    (hasParseableDereferenced(param) &&
      parseDereferenced(param.type.dereferenced, { ...param, parent }, fnRef)) ||
    ({
      ...getCommonParamValues(param),
      // @ts-ignore
      name: param.name || (typeof param.type === 'string' && param.type) || param.type.name,
      type: {
        type: 'reference',
        // @ts-ignore
        typeArguments: (param.type.typeArguments ?? []).map((typeArg) =>
          parseParam(typeArg.type, { type: typeArg }, { ...param, parent }, fnRef)
        ),
      },
    } satisfies ParsedUndefinedReferenceNode)
  )
}

function parseIndexSignature(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  if (!('indexSignature' in param)) return undefined

  return {
    ...getCommonParamValues(param),
    type: {
      type: 'indexedObject',
      indexes: param.indexSignature.parameters
        .filter(isParseable)
        .map((innerParam) =>
          parseParam(innerParam.type.type, innerParam, { ...param, parent }, fnRef)
        ),
      value:
        typeof param.indexSignature.type === 'string'
          ? parseParam(param.indexSignature.type, param.indexSignature, { ...param, parent }, fnRef)
          : undefined,
    },
  } satisfies ParsedIndexObjectNode
}

function parseCallSignature(param: SignatureParam, parent: ParentAtom, fnRef: FnRef) {
  if (param.kindString !== 'Call signature') return undefined

  return {
    ...getCommonParamValues(param),
    type: {
      type: 'functionSignature',
      parameters: (param.parameters ?? [])
        .filter(isParseable)
        .map((param) => parseParam(param.type.type, param, { ...param, parent }, fnRef)),
      returns:
        isParseable(param.type) && typeof param.type.type === 'string'
          ? parseParam(param.type.type, param, parent, fnRef)
          : undefined,
    },
  } satisfies ParsedCallSignatureNode
}

function parseSignatures(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  if (!('signatures' in param && Array.isArray(param.signatures))) return undefined

  return {
    ...getCommonParamValues(param),
    type: {
      type: 'function',
      signatures: param.signatures
        .map((sig) => parseCallSignature(sig, { ...param, parent }, fnRef))
        .filter(Boolean),
    },
  } satisfies ParsedSignatureNode
}

function parseReflectionType(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  if (!(isParseable(param.type) && 'declaration' in param.type)) return undefined

  return {
    ...(parseInterfaceType(param.type.declaration, { ...param, parent }, fnRef) ||
      parseIndexSignature(param.type.declaration, { ...param, parent }, fnRef) ||
      parseSignatures(param.type.declaration, { ...param, parent }, fnRef)),
    ...getCommonParamValues(param),
  } satisfies ParsedNode
}

function parseIntrinsicType(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: typeof param.type === 'string' ? param.type : param.type.name ?? '',
    },
  } satisfies ParsedNode
}

function parseLiteralType(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: 'literal',
      value: typeof param.type === 'string' ? undefined : param.type.value,
    },
  } satisfies ParsedLiteralNode
}

function parseUnionType(param: UnionParam, parent: ParentAtom, fnRef: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: 'union',
      // @ts-ignore -- type.type is checked in the filter
      types: param.type.types
        .filter((type) => type && typeof type.type === 'string')
        .map((type) => parseParam(type.type, { type }, { ...param, parent }, fnRef)),
    },
  } satisfies ParsedUnionNode
}

function parseTypeOperator(param: TypeOperatorParam, parent: ParentAtom, fnRef: FnRef) {
  switch (param.type.operator) {
    case 'readonly':
      const parsedTarget = parseParam(
        param.type.target.type,
        { type: param.type.target },
        { ...param, parent },
        fnRef
      )

      return {
        ...getCommonParamValues(param),
        type: {
          type: `readonly ${parsedTarget.type.type}`,
          innerType: parsedTarget,
        },
      } satisfies ParsedReadOnlyNode
    default:
      return undefined
  }
}

function parseIndexedAccess(param: ParamAtom, parent: ParentAtom, fnRef: FnRef) {
  return { ...getCommonParamValues(param) } satisfies ParsedNode
}

function parseParam(
  type: string,
  param: ParamAtom,
  parent: ParentAtom,
  fnRef: FnRef
): ParsedNode | undefined {
  switch (type) {
    case 'array':
      return parseArrayType(param as ArrayParam, parent, fnRef)
    case 'indexedAccess':
      return parseIndexedAccess(param, parent, fnRef)
    case 'intersection':
      break
    case 'intrinsic':
      return parseIntrinsicType(param, parent, fnRef)
    case 'literal':
      return parseLiteralType(param, parent, fnRef)
    case 'reference':
      return parseReferenceType(param, parent, fnRef)
    case 'reflection':
      return parseReflectionType(param, parent, fnRef)
    case 'typeOperator':
      return parseTypeOperator(param as TypeOperatorParam, parent, fnRef)
    case 'union':
      return parseUnionType(param as UnionParam, parent, fnRef)
    default:
      return undefined
  }
}

export { parseParam }
