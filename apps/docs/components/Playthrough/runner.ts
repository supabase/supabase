import type { Terminal } from 'xterm'
import { runLine, serverWatcher } from './container'
import { refreshFileTree } from './file-system'
import { runningWatcher, runWatcher } from './store'

let terminalResolve = (t: Terminal) => {}
let terminalPromise = new Promise<Terminal>((resolve) => {
  terminalResolve = resolve
})

let terminal: Terminal | undefined = undefined
let currentLine = ''

export function attachElement(element: HTMLElement) {
  if (terminal) {
    return () => {}
  }
  import('./xterm').then(({ attachTerminal }) => {
    terminal = attachTerminal(element)
    terminalResolve(terminal)

    terminal.onData((chunk) => {
      if (chunk === '\r') {
        executeAndWait()
      } else if (chunk === '\u007F' && currentLine.length > 0) {
        terminal.write('\b \b')
        currentLine = currentLine.slice(0, -1)
      } else if (chunk === '') {
        // ctrl + v
      } else {
        currentLine += chunk
        terminal.write(chunk)
      }
    })

    terminal.attachCustomKeyEventHandler((arg) => {
      if (arg.ctrlKey && arg.code === 'KeyV' && arg.type === 'keydown') {
        navigator.clipboard.readText().then((text) => {
          terminal.write(text)
          currentLine += text
        })
      }
      return true
    })
  })

  return () => {
    terminalPromise.then(() => terminal.dispose())
  }
}

let runningTasks = []

export function writeAndTrigger(line: string) {
  terminal.write(line)
  currentLine = line
  executeAndWait()
}

export async function writeAndRun(line: string) {
  terminal.write(line)
  currentLine = line
  await executeAndWait()
}

async function executeAndWait() {
  const process = await execute()
  runningTasks.push(process)
  const exitCode = await process.onDone
  runningTasks = runningTasks.filter((t) => t !== process)
  // sometimes the output of `run` runs after finishing
  setTimeout(() => {
    terminal.write('$ ')
  }, 1)

  runWatcher.notify({ line: currentLine, exitCode })
  currentLine = ''
  refreshFileTree()
}

async function execute() {
  runningWatcher.notify(currentLine)
  terminal.write('\r\n')
  const process = await runLine(currentLine, (out: string) => {
    writeOutput(out.replace(/\n/g, '\r\n'))
  })
  return process
}

export function stopServer() {
  runningTasks.forEach((task) => task.kill())
  serverWatcher.notify(null)
}

async function writeOutput(data: string) {
  return new Promise<void>((resolve) => {
    terminal.write(data, resolve)
  })
}
