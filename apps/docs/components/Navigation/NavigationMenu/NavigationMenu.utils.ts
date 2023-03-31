// check if the link is allowed to be displayed
export function isFuncNotInLibraryOrVersion(id, type, allowedKeys) {
  if (id && allowedKeys && !allowedKeys.includes(id) && type !== 'markdown') {
    return true
  }
}
