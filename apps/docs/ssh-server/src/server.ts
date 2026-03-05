import { createHash, generateKeyPairSync } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { globby } from 'globby'
import { Bash, defineCommand } from 'just-bash'
import ssh2 from 'ssh2'

// ssh2 is commonjs
const { Server } = ssh2

const DOCS_DIR = resolve(process.env.DOCS_DIR ?? '/docs')
const PORT = parseInt(process.env.PORT ?? '22', 10)

// Aliases as custom commands so just-bash handles piping/redirection correctly.
// e.g. `ll | grep foo` works because just-bash resolves `ll` before building the pipe.
const aliasCommands = [
  defineCommand('ll', (args, ctx) => ctx.exec!(`ls -alF ${args.join(' ')}`, { cwd: ctx.cwd })),
  defineCommand('la', (args, ctx) => ctx.exec!(`ls -a ${args.join(' ')}`, { cwd: ctx.cwd })),
  defineCommand('l', (args, ctx) => ctx.exec!(`ls -CF ${args.join(' ')}`, { cwd: ctx.cwd })),
]

// Build a lazy-loaded files map for just-bash.
// Keys are absolute paths as just-bash sees them (e.g. /docs/ai/overview.md).
// Values are functions so files are only read from disk when actually accessed.
async function buildFilesMap(): Promise<Record<string, () => Promise<string>>> {
  const paths = await globby('**/*.md', { cwd: DOCS_DIR, absolute: false })
  const files: Record<string, () => Promise<string>> = {}
  for (const rel of paths) {
    const vfsPath = `/docs/${rel}`
    const diskPath = resolve(DOCS_DIR, rel)
    files[vfsPath] = () => readFile(diskPath, 'utf8')
  }
  console.log(`Indexed ${paths.length} docs files from ${DOCS_DIR}`)
  return files
}

const HOST_KEY_PATH = resolve(process.env.HOST_KEY_PATH ?? './host_key')

async function loadOrCreateHostKey(): Promise<Buffer> {
  try {
    const pem = await readFile(HOST_KEY_PATH)
    const fingerprint = createHash('sha256').update(pem).digest('base64')
    console.log(`Loaded host key from ${HOST_KEY_PATH} (SHA256:${fingerprint})`)
    return pem
  } catch {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }) as string
    await writeFile(HOST_KEY_PATH, pem, { mode: 0o600 })
    const fingerprint = createHash('sha256').update(pem).digest('base64')
    console.log(`Generated host key → ${HOST_KEY_PATH} (SHA256:${fingerprint})`)
    return Buffer.from(pem)
  }
}

function makeBash(docsFiles: Record<string, () => Promise<string>>) {
  return new Bash({ files: docsFiles, cwd: '/docs', customCommands: aliasCommands })
}

async function main() {
  const [hostKey, docsFiles] = await Promise.all([loadOrCreateHostKey(), buildFilesMap()])

  const server = new Server({ hostKeys: [hostKey] }, (client) => {
    console.log('Client connected')

    // Accept all auth unconditionally - shell is sandboxed to just-bash
    client.on('authentication', (ctx) => ctx.accept())

    client.on('ready', () => {
      client.on('session', (accept) => {
        const session = accept()

        // No PTY support yet - just accept and ignore requests
        session.on('pty', (accept) => accept())

        session.on('exec', async (accept, _reject, info) => {
          const channel = accept()
          const command = info.command
          console.log(`exec: ${command}`)

          try {
            const bash = makeBash(docsFiles)
            const result = await bash.exec(command)
            if (result.stdout) channel.write(result.stdout)
            if (result.stderr) channel.stderr.write(result.stderr)
            channel.exit(result.exitCode)
          } catch (err) {
            channel.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`)
            channel.exit(1)
          }

          channel.end()
        })

        session.on('shell', async (accept) => {
          const channel = accept()
          const bash = makeBash(docsFiles)

          channel.write('Supabase docs shell. Type commands to query the docs.\r\n$ ')

          let buf = ''

          // Poor man's interactive shell
          channel.on('data', async (data: Buffer) => {
            const chunk = data.toString()
            for (const ch of chunk) {
              if (ch === '\r' || ch === '\n') {
                channel.write('\r\n')
                const command = buf.trim()
                buf = ''
                if (command === 'exit') {
                  channel.end()
                  return
                }
                if (command) {
                  try {
                    const result = await bash.exec(command)
                    if (result.stdout) channel.write(result.stdout.replace(/\n/g, '\r\n'))
                    if (result.stderr) channel.write(result.stderr.replace(/\n/g, '\r\n'))
                  } catch (err) {
                    channel.write(`Error: ${err instanceof Error ? err.message : String(err)}\r\n`)
                  }
                }
                channel.write('$ ')
              } else if (ch === '\x7f' || ch === '\b') {
                // backspace
                if (buf.length > 0) {
                  buf = buf.slice(0, -1)
                  channel.write('\b \b')
                }
              } else {
                buf += ch
                channel.write(ch)
              }
            }
          })
        })
      })
    })

    client.on('end', () => console.log('Client disconnected'))
    client.on('error', (err) => console.error('Client error:', err.message))
  })

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Docs SSH server listening on port ${PORT}`)
    console.log(`Connect: ssh localhost`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM')
  process.exit(0)
})
process.on('SIGINT', () => {
  console.log('SIGINT')
  process.exit(0)
})
