import { readFile, writeFile } from 'fs/promises'

interface SectionItem {
  id: string
  title: string
  slug: string
  product?: string
  type: string
  items?: SectionItem[]
}

interface Section {
  title: string
  id?: string
  type: string
  items?: SectionItem[]
}

async function main() {
  const sectionsPath = 'spec/common-client-libs-sections.json'
  const content = await readFile(sectionsPath, 'utf-8')
  const sections: Section[] = JSON.parse(content)

  let fixedCount = 0

  function fixTodos(items: (Section | SectionItem)[]) {
    for (const item of items) {
      if ('id' in item && item.id && item.title?.startsWith('TODO:')) {
        const oldTitle = item.title
        let newTitle = oldTitle

        // Database constructors
        if (item.product === 'database' && item.id === 'constructor') {
          newTitle = 'Create a query builder instance'
        }

        // Auth admin constructors
        else if (item.product === 'auth-admin' && item.id === 'constructor') {
          newTitle = 'Create an Auth Admin API instance'
        }

        // Functions constructor
        else if (item.product === 'functions' && item.id === 'constructor') {
          newTitle = 'Create a Functions client instance'
        }

        // Realtime constructors and methods
        else if (item.product === 'realtime') {
          if (item.id === 'constructor') {
            newTitle = 'Create a Realtime client instance'
          } else if (item.id === 'presencestate') {
            newTitle = 'Access current presence state'
          } else if (item.id === 'track') {
            newTitle = 'Track user presence in channel'
          } else if (item.id === 'untrack') {
            newTitle = 'Stop tracking user presence'
          } else if (item.id === 'updatejoinpayload') {
            newTitle = 'Update channel join payload'
          } else if (item.id === 'channel') {
            newTitle = 'Create or retrieve a channel'
          } else if (item.id === 'onheartbeat') {
            newTitle = 'Handle heartbeat events'
          } else if (item.id === 'createwebsocket') {
            newTitle = 'Create WebSocket connection'
          } else if (item.id === 'getwebsocketconstructor') {
            newTitle = 'Get WebSocket constructor function'
          } else if (item.id === 'iswebsocketsupported') {
            newTitle = 'Check if WebSocket is supported'
          } else if (item.id === 'addeventlistener') {
            newTitle = 'Add WebSocket event listener'
          } else if (item.id === 'close') {
            newTitle = 'Close WebSocket connection'
          } else if (item.id === 'removeeventlistener') {
            newTitle = 'Remove WebSocket event listener'
          } else if (item.id === 'send') {
            newTitle = 'Send message through WebSocket'
          }
        }

        // Storage constructors and methods
        else if (item.product === 'storage') {
          if (item.id === 'constructor') {
            newTitle = 'Create a Storage client instance'
          } else if (item.id === 'tobase64') {
            newTitle = 'Convert downloaded file to Base64'
          }
        }

        // Misc category (miscategorized items)
        else if (item.product === 'misc') {
          if (item.id === 'constructor') {
            newTitle = 'Create a client instance'
          } else if (item.id === 'presencestate') {
            newTitle = 'Access current presence state'
          } else if (item.id === 'track') {
            newTitle = 'Track user presence in channel'
          } else if (item.id === 'untrack') {
            newTitle = 'Stop tracking user presence'
          } else if (item.id === 'updatejoinpayload') {
            newTitle = 'Update channel join payload'
          } else if (item.id === 'channel') {
            newTitle = 'Create or retrieve a channel'
          } else if (item.id === 'onheartbeat') {
            newTitle = 'Handle heartbeat events'
          }
        }

        if (newTitle !== oldTitle) {
          console.log(`Fixed: ${item.id} (${item.product})`)
          console.log(`  Old: ${oldTitle}`)
          console.log(`  New: ${newTitle}`)
          item.title = newTitle
          fixedCount++
        }
      }

      if (item.items) {
        fixTodos(item.items)
      }
    }
  }

  fixTodos(sections)

  await writeFile(sectionsPath, JSON.stringify(sections, null, 2) + '\n', 'utf-8')

  console.log(`\n✅ Fixed ${fixedCount} TODO titles`)
}

main().catch(console.error)
