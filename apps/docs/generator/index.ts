import ApiGenerator from './api'
import CliGenerator from './cli'
import ConfigGenerator from './config'
import SdkGenerator from './sdk'
import LegacyGenerator from './legacy'
import { parseArgs } from 'node:util'
import { strict as assert } from 'node:assert'

const args = parseArgs({
  options: {
    input: {
      type: 'string',
    },
    output: {
      type: 'string',
      short: 'n',
    },
    type: {
      type: 'string',
      short: 'n',
    },
    url: {
      type: 'string',
      short: 'n',
    },
  },
})

const allowedTypes = ['cli', 'config', 'sdk', 'api', 'legacy'] as const
type AllowedType = (typeof allowedTypes)[number]

assert(args.values.input, 'input is required')
assert(args.values.output, 'output is required')
assert(allowedTypes.includes(args.values.type as AllowedType), 'type is required')

DocGenerator({
  input: args.values.input,
  output: args.values.output,
  type: args.values.type as AllowedType,
  url: args.values.url,
})

export default async function DocGenerator({
  input,
  output,
  type,
  url,
}: {
  input: string
  output: string
  type: AllowedType
  url?: string
}) {
  switch (type) {
    case 'api':
      await ApiGenerator(input, output, url || '')
      break

    case 'cli':
      await CliGenerator(input, output)
      break

    case 'config':
      await ConfigGenerator(input, output)
      break

    case 'sdk':
      await SdkGenerator(input, output)
      break

    case 'legacy':
      await LegacyGenerator(input, output)
      break

    default:
      await console.log('Unrecognized type: ', type)
      break
  }
  return 'Done'
}
