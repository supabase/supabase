import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseCliSpec, type CliSpec } from '~/generator/types/CliSpec'
import { parse } from 'yaml'

export async function loadCliSpecFile(specDirectory: string, specFile: string): Promise<CliSpec> {
  const fullPath = join(specDirectory, `${specFile}.yaml`)
  const raw = await readFile(fullPath, 'utf-8')
  return parseCliSpec(parse(raw), fullPath)
}
