import { uniq } from 'lodash'

export const selectItemsInRange = (id: string, snippets: any[], selectedSnippets: string[]) => {
  const lastSelectedItemIndex = snippets.findIndex(
    (x) => x.id === selectedSnippets[selectedSnippets.length - 1]
  )
  const selectedItemIndex = snippets.findIndex((x) => x.id === id)

  // Get the start and end index of the range to select
  const start = Math.min(selectedItemIndex, lastSelectedItemIndex)
  const end = Math.max(selectedItemIndex, lastSelectedItemIndex)

  // Get the range to select and reverse the order if necessary
  const rangeToSelect = snippets.slice(start, end + 1)
  if (selectedItemIndex < lastSelectedItemIndex) rangeToSelect.reverse()

  if (selectedSnippets.includes(id)) {
    const rangeToDeselectIds = rangeToSelect.map((item) => item.id)
    return selectedSnippets.filter((x) => x === id || !rangeToDeselectIds.includes(x))
  } else {
    return uniq(selectedSnippets.concat(rangeToSelect.map((x) => x.id) as string[]))
  }
}
