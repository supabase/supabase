import fs from 'fs'
import { strict as assert } from 'node:assert'
import { parseArgs } from 'node:util'
import stringify from 'json-stringify-safe'

import { writeToDisk } from './helpers'

const args = parseArgs({
  options: {
    input: {
      type: 'string',
    },
    output: {
      type: 'string',
      short: 'n',
    },
  },
})

assert(args.values.input, 'input is required')
assert(args.values.output, 'output is required')

dereference({ input: args.values.input!, output: args.values.output! })
interface KV {
  [key: string]: any
}

async function dereference({ input, output }: { input: string; output: string }) {
  console.log('input', input)

  const specRaw = fs.readFileSync(input, 'utf8')
  const spec = JSON.parse(specRaw)
  const kv = chilrenReducer({}, spec)

  // console.log('kv', kv)
  const dereferenced = dereferenceReducer(spec, kv)
  // console.log('dereferenced', dereferenced)
  await writeToDisk(output, stringify(dereferenced, null, 2))
  // console.log('JSON.stringify(dereferenced)', JSON.stringify(spec))
}

function chilrenReducer(acc: KV, child: any): KV {
  if (!!child.children) {
    child.children.forEach((x: any) => chilrenReducer(acc, x))
  }

  const { id }: { id: string } = child
  acc[id] = { ...child }
  return acc
}

// Recurse through all children, and if the `type.type` == 'reference'
// then it will add a key "dereferecnced" to the object.
function dereferenceReducer(child: any, kv: KV) {
  if (!!child.children) {
    child.children.forEach((x: any) => dereferenceReducer(x, kv))
  }
  if (!!child.signatures) {
    child.signatures.forEach((x: any) => dereferenceReducer(x, kv))
  }
  if (!!child.parameters) {
    child.parameters.forEach((x: any) => dereferenceReducer(x, kv))
  }
  if (
    !!child.type &&
    !!child.type.declaration &&
    !!child.type.declaration.children &&
    child.type.type === 'reflection'
  ) {
    child.type.declaration.children.forEach((x: any) => dereferenceReducer(x, kv))
  }

  const final = { ...child }
  if (
    // For now I can only dereference parameters
    // because anything else is producing an error when saving to file:
    // TypeError: Converting circular structure to JSON
    final.kindString === 'Parameter' &&
    final.type?.type === 'reference' &&
    final.type?.id
  ) {
    const dereferenced = kv[final.type.id]
    final.type.dereferenced = dereferenced || {}
    return final
  } else if (
    final.kindString === 'Property' &&
    final.type?.type === 'reference' &&
    final.type?.id
  ) {
    const dereferenced = kv[final.type.id]
    final.type.dereferenced = dereferenced || {}
    return final
  } else if (final.kindString === 'Type alias' && final.type?.type === 'union') {
    // handles union types that contain nested references
    // by replacing the reference in-place
    final.type.types = final.type.types.map((item: any) => {
      return item.type === 'reference' ? kv[item.id] : item
    })
    return final
  } else {
    return final
  }
}
