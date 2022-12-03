export function saveFileCommand(path: string, contents: string = '') {
  return {
    type: 'saveFile',
    path,
    contents,
  }
}

export function runCommand(line: string) {
  return {
    type: 'run',
    line,
  }
}

export function goToFileCommand(path: string) {
  return {
    type: 'goToFile',
    path,
  }
}
