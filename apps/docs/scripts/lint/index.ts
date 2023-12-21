import { parseArgs } from 'node:util'
import { lint } from './linter'
import { isDirectory } from './utils/files'
import { resolve } from 'node:path'

const args = parseArgs({
  options: {
    debug: {
      type: 'boolean',
      short: 'd',
    },
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

  let targetIsDirectory: boolean
  try {
    targetIsDirectory = await isDirectory(target)
  } catch {
    console.error('Coud not access target file or directory:', target)
    process.exit(1)
  }
  console.log(targetIsDirectory ? 'Linting directory:' : 'Linting file:', target)

  const isAutoFixOn = Boolean(args.values.fix)
  if (isAutoFixOn) {
    console.log('Autofixing is on')
  }

  const isDebugOn = Boolean(args.values.debug)
  if (isDebugOn) {
    console.log('Debug mode is on')
  }

  const errors = await lint(target, { autoFix: isAutoFixOn, isDirectory: targetIsDirectory })
  if (isDebugOn) {
    console.log(JSON.stringify(errors, null, 2))
  }
}

main()
