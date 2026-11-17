import {
  serializeFilterProperties,
  updateGroupAtPath,
  type FilterBarAction,
  type FilterGroup,
  type FilterProperty,
} from 'ui-patterns/FilterBar'

import { useSqlFilterGenerateMutation } from '@/data/ai/sql-filter-mutation'

/**
 * A FilterBar "Filter by AI" action: turns the typed prompt into filters over `filterProperties`
 * and hands back the whole filter group with them in place. Generated filters are complete, so
 * callers apply them straight away rather than waiting for the user to leave the bar.
 */
export function useFilterBarAiAction({
  filterProperties,
  onGenerate,
}: {
  filterProperties: FilterProperty[]
  onGenerate: (filters: FilterGroup) => void
}) {
  const { mutateAsync: generateFilters, isPending: isGenerating } = useSqlFilterGenerateMutation()

  const action: FilterBarAction = {
    value: 'ai-filter',
    label: 'Filter by AI',
    onSelect: async (inputValue, { path, activeFilters }) => {
      const prompt = inputValue.trim()
      if (!prompt) return

      const generated = await generateFilters({
        prompt,
        filterProperties: serializeFilterProperties(filterProperties),
        currentPath: path,
      })
      onGenerate(updateGroupAtPath(activeFilters, path, generated))
    },
  }

  return { actions: [action], isGenerating }
}
