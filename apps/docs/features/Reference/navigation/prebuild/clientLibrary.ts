import { mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

import type { TypeSpec } from '../../../../components/reference/Reference.types'
import { menus } from '../../../../features/Navigation/NavigationMenu/menus'
import { flattenSections } from '../../../../lib/helpers'
import commonSections from '../../../../spec/common-client-libs-sections.json' assert { type: 'json' }
import typeSpecV1 from '../../../../spec/enrichments/tsdoc_v1/combined.json'
import typeSpecV2 from '../../../../spec/enrichments/tsdoc_v2/combined.json'
import { toRefNavMenu } from './pipeline'

const flatSections = flattenSections(commonSections)

const clientLibraries = menus.filter(
  (menu) =>
    'commonSectionsFile' in menu && menu.commonSectionsFile === 'common-client-libs-sections.json'
)

const parseFunctionRef = (functionRef: string) => {
  const path = functionRef.split('.')

  return path.length === 3
    ? {
        library: path[0],
        class: path[1],
        method: path[2],
      }
    : path.length === 4
      ? {
          library: path[0],
          module: path[1],
          class: path[2],
          method: path[3],
        }
      : console.error('Invalid path for function ref:', functionRef)
}

function consoleIf(fnRef, ...args) {
  if (!fnRef) console.log(...args)
}

function hasTypeParameter(parent) {
  let curr = parent
  while (curr) {
    if ('typeParameter' in curr) return true
    curr = curr.parent
  }
  return false
}

function getTypeParameters(parent) {
  let curr = parent
  while (curr) {
    if ('typeParameter' in curr) return [curr.typeParameter, curr]
    curr = curr.parent
  }
  return [null, null]
}

function hasDereferenced(param) {
  return !!param.type?.dereferenced
}

function parseArrayType(param, parent, fnRef) {
  return {
    name: param.name,
    comment: param.comment,
    type: 'array',
    elementType: parseParamDetails2(
      param.type.elementType.type,
      param.type.elementType,
      { ...param, parent },
      fnRef
    ),
  }
}

function parseInterface(dereferenced, parent, fnRef) {
  if (!dereferenced.children) return undefined
  consoleIf(fnRef, 'interface', dereferenced, parent)
  const result = {
    type: 'interface',
    name: dereferenced.name,
    comment: dereferenced.comment,
    properties: dereferenced.children.map((child) => ({
      ...parseParamDetails2(child.type.type, child, { ...dereferenced, parent }, fnRef),
      optional: child.flags?.isOptional,
    })),
  }
  return result
}

function parseTypeParameter(param, parent, fnRef) {
  const [typeParameters, ancestor] = getTypeParameters(parent)
  const typeParam = typeParameters.find((some) => some.name === param.type.name)
  if (!typeParam) return undefined

  return {
    name: param.name,
    comment: param.comment,
    defaultValue: param.defaultValue,
    optional: param.flags.isOptional,
    type: parseParamDetails2(typeParam.type.type, typeParam, ancestor, fnRef),
  }
}

function parseDereferenced(dereferenced, parent, fnRef) {
  if (!dereferenced.name === parent.type?.name) return undefined

  return (
    (!!dereferenced.type?.type &&
      parseParamDetails2(dereferenced.type.type, dereferenced, parent, fnRef)) ||
    (dereferenced.kindString === 'Interface' && parseInterface(dereferenced, parent, fnRef)) ||
    undefined
  )
}

function parseReferenceType(param, parent, fnRef) {
  console.log('parseReferenceType:', param, JSON.stringify(parent, null, 2))

  return (
    (hasTypeParameter(parent) && parseTypeParameter(param, parent, fnRef)) ||
    (hasDereferenced(param) &&
      parseDereferenced(param.type.dereferenced, { ...param, parent }, fnRef)) ||
    undefined
  )
}

function parseIndexSignature(declaration, parent, fnRef) {
  if (!declaration.indexSignature) return undefined

  consoleIf(fnRef, 'parsing index signature')
  return {
    type: 'indexed object',
    name: declaration.name,
    comment: declaration.comment,
    indexes: declaration.indexSignature.parameters.map((param) => ({
      type: parseParamDetails2(param.type.type, param, { ...declaration, parent }, fnRef),
    })),
    value: parseParamDetails2(
      declaration.indexSignature.type.type,
      declaration.indexSignature,
      { ...declaration, parent },
      fnRef
    ),
  }
}

function parseCallSignature(signature, parent, fnRef) {
  if (signature.kindString !== 'Call signature') return undefined
  consoleIf(fnRef, 'parse call:', JSON.stringify(signature, null, 2))

  return {
    name: signature.name,
    type: 'functionSignature',
    comment: signature.comment,
    parameters: (signature.parameters ?? []).map((param) =>
      parseParamDetails2(param.type.type, param, { ...signature, parent }, fnRef)
    ),
    returns: parseParamDetails2(signature.type.type, signature, parent, fnRef),
  }
}

function parseSignatures(declaration, parent, fnRef) {
  consoleIf(fnRef, 'parsing signatures:', JSON.stringify(declaration, null, 2))
  if (!declaration.signatures) return undefined

  return {
    name: declaration.name,
    comment: declaration.comment,
    type: 'function',
    optional: declaration.flags?.isOptional,
    signatures: declaration.signatures.map((sig) =>
      parseCallSignature(sig, { ...declaration, parent }, fnRef)
    ),
  }
}

function parseReflectionType(param, parent, fnRef) {
  if (param.type.declaration.kindString === 'Type literal') {
    consoleIf(fnRef, 'parsing reflection:', param)
    return {
      name: param.name,
      comment: param.comment,
      defaultValue: param.defaultValue,
      type:
        parseInterface(param.type.declaration, { ...param, parent }, fnRef) ||
        parseIndexSignature(param.type.declaration, { ...param, parent }, fnRef) ||
        parseSignatures(param.type.declaration, { ...param, parent }, fnRef),
    }
  }
  return undefined
}

function parseIntrinsicType(param, parent, fnRef) {
  return {
    name: param.name,
    type: param.type.name,
    comment: param.comment,
  }
}

function parseLiteralType(param, parent, fnRef) {
  return {
    name: param.name,
    type: 'literal',
    value: param.type.value,
    comment: param.comment,
  }
}

function parseUnionType(param, parent, fnRef) {
  return {
    name: param.name,
    type: 'union',
    comment: param.comment,
    types: param.type.types.map((type) =>
      parseParamDetails2(type.type, { type }, { ...param, parent }, fnRef)
    ),
  }
}

function parseParamDetails2(type, param, parent, fnRef) {
  consoleIf(fnRef, type, param)
  switch (type) {
    case 'array':
      return parseArrayType(param, parent, fnRef)
    case 'indexedAccess':
      break
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
      break
    case 'union':
      return parseUnionType(param, parent, fnRef)
    default:
      return undefined
  }
}

const getTypes = (fn, version: 'v1' | 'v2') => {
  const typeSpec = version === 'v1' ? typeSpecV1 : (typeSpecV2 as TypeSpec)

  const parsedPath = parseFunctionRef(fn['$ref'])
  if (!parsedPath) return undefined
  const { library: _library, class: _class, module: _module, method: _method } = parsedPath

  const library = typeSpec.children.find((library) => library.name === _library)
  if (!library) {
    console.error('Invalid library for function ref:', fn['$ref'])
    return undefined
  }

  if (!_module) {
    const cls = library.children.find((child) => child.name === _class)
    if (!cls) {
      console.error('Invalid class for function ref:', fn['$ref'])
      return undefined
    }

    const method = cls.children.find((child) => child.name === _method)
    if (!method) {
      console.error('Invalid class for function ref:', fn['$ref'])
      return undefined
    }

    const signatures = 'signatures' in method ? method.signatures : undefined
    if (!signatures) {
      console.error('No signatures found for method:', [library, cls, method].join('.'))
      return undefined
    }

    const simpleSigs = signatures.map((sig) => {
      const params = (sig.parameters ?? []).map((param) => {
        consoleIf(null, fn['$ref'])
        const paramDetails = parseParamDetails2(param.type.type, param, sig, fn['$ref'])
        if (paramDetails) {
          consoleIf(null, 'successfully parsed:', JSON.stringify(paramDetails, null, 2))
        } else {
          consoleIf(null, 'not parsed')
        }

        return {
          name: param.name,
          comment: param.comment,
          ...paramDetails,
        }
      })

      return {
        comment: sig.comment,
        params,
      }
    })
  }

  return {}
}

const includeTsDoc = (spec, fn) => spec.id.includes('javascript') && '$ref' in fn

const main = async () => {
  mkdirSync(join(process.cwd(), 'apps/docs/features/Navigation/refNavigation/generated'), {
    recursive: true,
  })

  const promises = [
    writeFile(
      join(
        process.cwd(),
        'apps/docs/features/Navigation/refNavigation/generated',
        'commonClientLibFlat.json'
      ),
      JSON.stringify(flatSections, null, 2),
      { encoding: 'utf-8' }
    ),
  ]

  const pendingSpecs = clientLibraries.map(async (library) => ({
    ...library,
    // TODO: Change this to be more robust with import meta URL
    spec: parse(await readFile(join(process.cwd(), 'apps/docs/spec', library.specFile), 'utf-8')),
  }))

  const specs = await Promise.all(pendingSpecs)

  specs
    .map((spec) => ({
      id: spec.id,
      navData: toRefNavMenu({
        sections: commonSections,
        excludedName: spec.id,
        includeList: {
          tag: 'function',
          list: spec.spec.functions.map((fn) => fn.id).filter(Boolean),
        },
        sectionPath: '/csharp',
      }),
    }))
    .forEach((navData) => {
      promises.push(
        writeFile(
          join(
            process.cwd(),
            'apps/docs/features/Navigation/refNavigation/generated',
            `${navData.id}.json`
          ),
          JSON.stringify(navData.navData, null, 2),
          { encoding: 'utf-8' }
        )
      )
      return promises
    })

  specs.map((spec) =>
    flatSections
      .filter((section) => !('excludes' in section && section.excludes.includes(spec.id)))
      .map((section) => {
        if (section.type === 'markdown') {
          return section
        }

        if (section.type === 'function') {
          const fn = spec.spec.functions.find((fn) => fn.id === section.id)
          if (!fn) return null

          return {
            ...section,
            ...(includeTsDoc(spec, fn) && getTypes(fn, spec.id.includes('v1') ? 'v1' : 'v2')),
            ...(fn.notes && { notes: fn.notes }),
            examples: fn.examples,
          }
        }

        return undefined
      })
      .filter(Boolean)
  )

  await Promise.all(promises).catch((err) => {
    console.error(err)
  })
}

main()
