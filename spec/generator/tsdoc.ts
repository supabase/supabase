import { writeToDisk } from './src/docs/helpers'
import stringify from 'json-stringify-safe'

const fs = require('fs')

const main = (command: string[], options: any) => {
  handleInput(command[0], options)
}

// Run everything
const argv = require('minimist')(process.argv.slice(2))
main(argv['_'], argv)

function handleInput(command: string, options: any) {
  switch (command) {
    case 'dereference':
      dereference(options)
      break

    default:
      console.log('Unrecognized command:', command)
      break
  }
}

interface KV {
  [key: string]: any
}

async function dereference({
  input,
  output,
}: {
  input: string
  output: string
}) {
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
  const final = { ...child }
  if (
    // For now I can only dereference parameters
    // because anything else is producing an error when saving to file:
    // TypeError: Converting circular structure to JSON
    final.kindString == 'Parameter' &&
    final.type?.type == 'reference' &&
    final.type?.id
  ) {
    const dereferenced = kv[final.type.id]
    final.type.dereferenced = dereferenced || {}
    return final
  } else {
    return final
  }
}
