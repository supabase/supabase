import path from 'path'
import { readSvgDirectory } from '../utils/helpers.mjs'

async function getIconMetaData(iconDirectory) {
  const iconJsons = readSvgDirectory(iconDirectory, '.json')
  const aliasesEntries = await Promise.all(
    iconJsons.map(async (jsonFile) => {
      const file = await import(path.join(iconDirectory, jsonFile), { assert: { type: 'json' } })
      return [path.basename(jsonFile, '.json'), file.default]
    })
  )

  return Object.fromEntries(aliasesEntries)
}

export default getIconMetaData
