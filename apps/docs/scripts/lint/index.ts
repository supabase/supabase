import { parseArgs } from 'node:util'
import { lint } from './linter'
import { isDirectory } from './utils/files'
import { resolve } from 'node:path'

const args = parseArgs({
  options: {
    fix: {
      type: 'boolean',
      short: 'f',
    },
  },
  allowPositionals: true,
})

async function main() {
  if (args.positionals.length > 1) {
    console.error('This script only takes one positional argument. Ignoring extra arguments.')
  }

  let target = args.positionals[0]
  target = resolve(target)

  const targetIsDirectory = await isDirectory(target)
  console.log(targetIsDirectory ? 'Linting directory:' : 'Linting file:', target)

  const isAutoFixOn = Boolean(args.values.fix)
  if (isAutoFixOn) {
    console.log('Autofixing is on')
  }

  lint(target, { autoFix: isAutoFixOn, isDirectory: targetIsDirectory })
}

main()
