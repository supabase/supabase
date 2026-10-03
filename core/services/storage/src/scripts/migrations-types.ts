import fs from 'fs'
import path from 'path'

const isIdentifier = (s: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s)

function main() {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations', 'tenant')
  const files = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const numA = parseInt(path.basename(a).match(/^(\d+)/)?.[1] || '0', 10)
      const numB = parseInt(path.basename(b).match(/^(\d+)/)?.[1] || '0', 10)
      return numA - numB
    })

  const migrations = [
    // this migration is hardcoded by the postgres migrations library
    {
      file: 'create-migrations-table',
      index: 0,
    },
  ]

  files.forEach((file, index) => {
    const fileName = file.replace(/[0-9]+-/, '').replace('.sql', '')

    migrations.push({
      file: fileName || '',
      index: index + 1,
    })
  })

  const migrationsEnum = migrations.map((migration) => {
    const key = isIdentifier(migration.file) ? migration.file : `'${migration.file}'`
    return `  ${key}: ${migration.index},`
  })

  const template = `export const DBMigration = {
${migrationsEnum.join('\n')}
} as const
`

  const destinationPath = path.resolve(
    __dirname,
    '..',
    'internal',
    'database',
    'migrations',
    'types.ts'
  )
  fs.writeFileSync(destinationPath, template, 'utf-8')
}

main()
