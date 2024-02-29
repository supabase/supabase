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

function hasTypeParameter(sig) {
  return 'typeParameter' in sig
}

function hasDereferenced(param) {
  return !!param.type?.dereferenced
}

function parseArrayType(param, sig, fnRef) {
  return {
    type: 'array',
    elementType: parseParamDetails2(
      param.type.elementType.type,
      param.type.elementType,
      sig,
      fnRef
    ),
  }
}

function parseInterface(_param, dereferenced, sig, fnRef) {
  if (!dereferenced.children) return undefined
  return {
    type: 'interface',
    properties: dereferenced.children.map((child) => ({
      name: child.name,
      type: parseParamDetails2(child.type.type, child, sig, fnRef),
    })),
  }
}

function parseTypeParameter(param, typeParams, sig, fnRef) {
  const typeParam = typeParams.find((some) => some.name === param.name)
  if (!typeParam) return undefined

  console.log('typeParam:', typeParam)
  return undefined
}

function parseDereferenced(param, dereferenced, sig, fnRef) {
  try {
    if (!dereferenced.name === param.type.name) return undefined

    return (
      (!!dereferenced.type?.type &&
        parseParamDetails2(dereferenced.type.type, dereferenced, sig, fnRef)) ||
      (dereferenced.kindString === 'Interface' &&
        parseInterface(param, dereferenced, sig, fnRef)) ||
      console.log('unknown dereferenced type:', JSON.stringify(dereferenced, null, 2))
    )
  } catch (err) {
    console.error(err)
    console.log(param)
  }
}

function parseReferenceType(param, sig, fnRef) {
  console.log(fnRef)
  // console.log(JSON.stringify(sig, null, 2))

  return (
    (hasTypeParameter(sig) && parseTypeParameter(param, sig.typeParameter, sig, fnRef)) ||
    (hasDereferenced(param) && parseDereferenced(param, param.type.dereferenced, sig, fnRef)) ||
    undefined
  )
}

function parseParamDetails2(type, param, sig, fnRef) {
  switch (type) {
    case 'array':
      return parseArrayType(param, sig, fnRef)
    case 'reference':
      return parseReferenceType(param, sig, fnRef)
    default:
    // not implemented
  }
}

// Param type is param.type in the original, there seems to be layer missing in the nested
const parseParamDetails = (paramType, param, sig, logRef) => {
  try {
    switch (paramType.type) {
      case 'array':
        return {
          type: 'array',
          elementType: parseParamDetails(paramType.elementType, paramType, sig, logRef),
        }
      case 'indexedAccess':
        console.log('indexed access:', logRef)
        break
      case 'intrinsic':
        return {
          type: paramType.name,
        }
      case 'intersection':
        break
      case 'literal':
        return {
          type: 'literal',
          value: paramType.value,
        }
      case 'reference':
        const reference = sig.typeParameter?.find((typeParam) => typeParam.name === paramType.name)
        const dereferenced = paramType.dereferenced
        if (!(reference || dereferenced)) {
          console.error(
            'Could not reference for type parameter:',
            paramType.name,
            JSON.stringify(sig, null, 2)
          )
          return null
        }

        return {
          type: 'reference',
          underlyingType: reference
            ? parseParamDetails(reference.type, reference, sig, logRef)
            : undefined, // TODO
        }
      case 'reflection':
        // console.log(param.type.declaration)
        break
      case 'typeOperator':
        break
      case 'union':
        break
      default:
        console.error('missing:', paramType)
    }
  } catch (err) {
    console.log(err, paramType, param, sig, logRef)
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
        const paramDetails = parseParamDetails2(param.type.type, param, sig, fn['$ref'])

        return {
          name: param.name,
          comment: param.comment?.shortText,
          ...paramDetails,
        }
      })

      return {
        comment: sig.comment?.shortText,
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
