import ApiGenerator from './api'
import CliGenerator from './cli'
import ConfigGenerator from './config'
import SdkGenerator from './sdk'

export default async function DocGenerator({
  input,
  output,
  type,
  url,
}: {
  input: string
  output: string
  type: 'cli' | 'config' | 'sdk' | 'api'
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

    default:
      await console.log('Unrecognized type: ', type)
      break
  }
  return 'Done'
}
