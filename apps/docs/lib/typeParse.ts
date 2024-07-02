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
type ParamBase = {
  name?: string
  comment?: unknown
  defaultValue?: unknown
  type: {
    type?: string
    name?: string
    value?: unknown
    dereferenced?: Dereferenced
    declaration?: Omit<ParamBase, 'kindString' | 'type'> & Pick<Required<ParamBase>, 'kindString'>
    typeArguments?: Array<ParamBase['type']>
  }
  kindString?: string
  indexSignature?: SignatureParam
  children?: Array<ParamBase>
  signatures?: Array<ParamBase & { parameters: Array<ParamBase> }>
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

type ArrayParam = Omit<ParamBase, 'type'> & {
  type: { type: 'array'; elementType: ParamBase['type'] }
}

type SignatureParam = ParamBase & {
  parameters: Array<ParamBase>
}

type TypeOperatorParam = ParamBase & {
  type: {
    type: 'typeOperator'
    operator: string
    target: ParamBase['type']
  }
}

type UnionParam = Omit<ParamBase, 'type'> & {
  type: { type: 'union'; types: Array<ParamBase['type']> }
}

type IndexedAccessParam = Omit<ParamBase, 'type'> & {
  type: { type: 'indexedAccess'; indexType: ParamBase['type']; objectType: ParamBase['type'] }
}

type IntersectionParam = Omit<ParamBase, 'type'> & {
  type: {
    type: 'intersection'
    types: Array<ParamBase['type']>
  }
}

type TypeParameter = Omit<ParamBase, 'type'> & {
  type?: ParamBase['type']
  default?: ParamBase['type']
}

type ParentBase = {
  typeParameter?: Array<TypeParameter>
  /**
   * The chain of ancestor params must always be trackable back to the origin
   * parent, because that is the only node with the `typeParameter`, which often
   * needs to be read in a deeper node.
   */
  parent?: ParentBase
}

/**
 * The parsed types contain the final parsed shapes of the type defs.
 */
type ParsedAtom = {
  name?: string
  type: {
    name?: string
    type: string
  }
  comment?: unknown
  defaultValue?: unknown
  optional?: boolean
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

type ParsedIndexedAccessNode = ParsedAtom & {
  type: {
    type: 'indexedAccess'
    objectType: ParsedNode
    indexType: ParsedNode
  }
}

type ParsedIntersectionNode = ParsedAtom & {
  type: {
    type: 'intersection'
    types: Array<ParsedNode>
  }
}

type ParsedNode =
  | ParsedArrayNode
  | ParsedInterfaceNode
  | ParsedIndexObjectNode
  | ParsedSignatureNode
  | ParsedIntrinsicNode
  | ParsedUnionNode
  | ParsedReadOnlyNode
  | ParsedIndexedAccessNode
  | ParsedIntersectionNode

/**
 * Passed along for logging purposes
 */
type FnRef = string

function getCommonParamValues<
  P extends Pick<ParamBase, 'name' | 'defaultValue' | 'flags' | 'comment'>,
>(param: P) {
  return {
    // __type nad __index are internal marke and not useful for display
    ...(param.name && param.name !== '__type' && param.name !== '__index' && { name: param.name }),
    ...(param.comment && { comment: param.comment }),
    ...(param.defaultValue && { defaultValue: param.defaultValue }),
    ...(param.flags?.isOptional && { optional: param.flags?.isOptional }),
  }
}

function hasTypeParameter(parent: ParentBase) {
  let curr = parent
  while (curr) {
    if ('typeParameter' in curr) return true
    curr = curr.parent
  }
  return false
}

function getTypeParameters(
  parent: ParentBase
): [Array<TypeParameter>, ParentBase] | [undefined, undefined] {
  let curr = parent
  while (curr) {
    if ('typeParameter' in curr) return [curr.typeParameter, curr]
    curr = curr.parent
  }
  return [undefined, undefined]
}

function hasDereferenced(param: ParamBase) {
  return (
    typeof param.type === 'object' &&
    !!param.type.dereferenced &&
    Object.keys(param.type.dereferenced).length > 0
  )
}

function parseArrayType(param: ArrayParam, parent: ParentBase, fnRef: FnRef) {
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

function parseInterfaceType<
  P extends Pick<ParamBase, 'name' | 'defaultValue' | 'flags' | 'comment' | 'children'>,
>(param: P, parent: ParentBase, fnRef: FnRef) {
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

function parseTypeParameter(param: ParamBase, parent: ParentBase, fnRef: FnRef) {
  if (!isParseableWithName(param.type)) return undefined

  const [typeParameters, ancestor] = getTypeParameters(parent)
  const typeParam = typeParameters.find((some) => some.name === param.type.name)
  if (!typeParam) return undefined

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

function parseDereferenced(param: ParamBase, parent: ParentBase, fnRef: FnRef) {
  function parseAndAnnotate() {
    const parsed = parseParam(param.type.type, param, parent, fnRef)
    return {
      ...parsed,
      type: {
        ...parsed.type,
        ...(param.name && { name: param.name }),
      },
    }
  }

  return (
    (isParseable(param) && parseAndAnnotate()) ||
    (param.kindString === 'Interface' && parseInterfaceType(param, parent, fnRef)) ||
    undefined
  )
}

function parseReferenceType(param: ParamBase, parent: ParentBase, fnRef: FnRef) {
  return (
    (hasTypeParameter(parent) && parseTypeParameter(param, parent, fnRef)) ||
    (hasDereferenced(param) && {
      // @ts-ignore -- param.type.dereferenced is checked by hasParseableDereferenced
      ...parseDereferenced(param.type.dereferenced, { ...param, parent }, fnRef),
      ...getCommonParamValues(param),
    }) ||
    ({
      ...getCommonParamValues(param),
      // @ts-ignore
      name: param.name || (typeof param.type === 'string' && param.type) || param.type.name,
      type: {
        type: 'reference',
        // @ts-ignore
        typeArguments: (param.type.typeArguments ?? []).map((typeArg: ParamBase['type']) =>
          parseParam(typeArg.type, { type: typeArg }, { ...param, parent }, fnRef)
        ),
      },
    } satisfies ParsedUndefinedReferenceNode)
  )
}

function parseIndexSignature<
  P extends Pick<ParamBase, 'name' | 'defaultValue' | 'flags' | 'comment' | 'indexSignature'>,
>(param: P, parent: ParentBase, fnRef: FnRef) {
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
        typeof param.indexSignature.type.type === 'string'
          ? parseParam(
              param.indexSignature.type.type,
              param.indexSignature,
              { ...param, parent },
              fnRef
            )
          : undefined,
    },
  } satisfies ParsedIndexObjectNode
}

function parseCallSignature(param: SignatureParam, parent: ParentBase, fnRef: FnRef) {
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

function parseSignatures<
  P extends Pick<ParamBase, 'name' | 'defaultValue' | 'flags' | 'comment' | 'signatures'>,
>(param: P, parent: ParentBase, fnRef: FnRef) {
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

function parseReflectionType(param: ParamBase, parent: ParentBase, fnRef: FnRef) {
  if (!(isParseable(param.type) && 'declaration' in param.type)) return undefined

  return {
    ...(parseInterfaceType(param.type.declaration, { ...param, parent }, fnRef) ||
      parseIndexSignature(param.type.declaration, { ...param, parent }, fnRef) ||
      parseSignatures(param.type.declaration, { ...param, parent }, fnRef)),
    ...getCommonParamValues(param),
  } satisfies ParsedNode
}

function parseIntrinsicType(param: ParamBase, _: ParentBase, __: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: typeof param.type === 'string' ? param.type : param.type.name ?? '',
    },
  } satisfies ParsedNode
}

function parseLiteralType(param: ParamBase, _: ParentBase, __: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: 'literal',
      value: typeof param.type === 'string' ? undefined : param.type.value,
    },
  } satisfies ParsedLiteralNode
}

function parseUnionType(param: UnionParam, parent: ParentBase, fnRef: FnRef) {
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

function parseTypeOperator(param: TypeOperatorParam, parent: ParentBase, fnRef: FnRef) {
  switch (param.type.operator) {
    case 'readonly': {
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
    }
    case 'keyof': {
      const parsedTarget = parseParam(
        param.type.target.type,
        { type: param.type.target },
        { ...param, parent },
        fnRef
      )
      return {
        ...getCommonParamValues(param),
        type: {
          type: `keyof ${parsedTarget.type.type}`,
          innerType: parsedTarget,
        },
      }
    }
    default:
      return undefined
  }
}

function parseIndexedAccess(param: IndexedAccessParam, parent: ParentBase, fnRef: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: 'indexedAccess',
      objectType: parseParam(
        param.type.objectType.type,
        { type: param.type.objectType },
        { ...param, parent },
        fnRef
      ),
      indexType: parseParam(
        param.type.indexType.type,
        { type: param.type.indexType },
        { ...param, parent },
        fnRef
      ),
    },
  } satisfies ParsedIndexedAccessNode
}

function parseIntersectionType(param: IntersectionParam, parent: ParentBase, fnRef: FnRef) {
  return {
    ...getCommonParamValues(param),
    type: {
      type: 'intersection',
      types: param.type.types.map((type) =>
        parseParam(type.type, { type }, { ...param, parent }, fnRef)
      ),
    },
  }
}

function parseParam(
  type: string,
  param: ParamBase,
  parent: ParentBase,
  fnRef: FnRef
): ParsedNode | undefined {
  switch (type) {
    case 'array':
      return parseArrayType(param as ArrayParam, parent, fnRef)
    case 'indexedAccess':
      return parseIndexedAccess(param as IndexedAccessParam, parent, fnRef)
    case 'intersection':
      return parseIntersectionType(param as IntersectionParam, parent, fnRef)
    case 'intrinsic':
      return parseIntrinsicType(param, parent, fnRef)
    case 'literal':
      return parseLiteralType(param, parent, fnRef)
    case 'reference':
      return parseReferenceType(param, parent, fnRef)
    case 'reflection':
      return parseReflectionType(param, parent, fnRef)
    case 'template-literal':
      break
    case 'typeOperator':
      return parseTypeOperator(param as TypeOperatorParam, parent, fnRef)
    case 'union':
      return parseUnionType(param as UnionParam, parent, fnRef)
    default:
      return undefined
  }
}

export type { ParentBase }
export { parseParam }
