import { writeAndRun, writeAndTrigger } from './runner'
import { readFile, saveFile, setCurrentPath } from './file-system'
import { fileTreeWatcher, runningWatcher, runWatcher, stepWatcher } from './store'
import { allSteps } from './steps-data'

function getCurrentStep() {
  return stepWatcher.get()
}

export function nextStep() {
  const nextStep = allSteps[getCurrentStep().stepIndex + 1]
  stepWatcher.notify(nextStep)
}

export async function solveStep() {
  const step = getCurrentStep()
  const solution = step.solution || []
  step.loading = true
  stepWatcher.notify({ ...step })
  await runCommands(solution)
  step.loading = false
}

stepWatcher.subscribe(async (step, prev) => {
  if (prev?.stepIndex == step?.stepIndex) {
    return
  }
  const { intro } = getCurrentStep()
  if (intro) {
    await runCommands(intro, true)
  }
})

async function runCommands(commands: any[], intro: boolean = false) {
  let i = 0
  while (i < commands.length) {
    const { command, path, contents, currentPath, onRunning } = commands[i]

    if (command) {
      if (onRunning) {
        writeAndTrigger(command)
      } else {
        await writeAndRun(command)
      }
    } else if (path) {
      if (!intro) setCurrentPath(path)
      await saveFile(path, contents)
    } else if (currentPath) {
      setCurrentPath(currentPath)
    }
    i++
  }
}

// check if should go next step
runningWatcher.subscribe((line) => {
  const step = getCurrentStep()
  const solution = step?.solution || []
  if (solution[0]?.command === line) {
    if (solution[0]?.onRunning) {
      nextStep()
    } else {
      step.loading = true
      stepWatcher.notify({ ...step })
    }
  }
})
runWatcher.subscribe(({ line }) => {
  const step = getCurrentStep()
  const solution = step?.solution || []
  if (solution[0]?.command === line && !solution[0]?.onRunning) {
    step.loading = false
    nextStep()
  }
})
fileTreeWatcher.subscribe(async (fileTree) => {
  const step = getCurrentStep()
  const solution = step?.solution || []
  if (solution[0].path) {
    const { path, contents } = step.solution[0]
    const fileContent = await readFile(path)
    if (fileContent === contents) {
      nextStep()
    }
  }
})
