import { useCallback } from 'react'
import { ActiveInput } from './hooks'
import { FilterProperty, FilterGroup } from './types'
import { 
  findGroupByPath, 
  addFilterToGroup, 
  addGroupToGroup, 
  isCustomOptionObject,
  updateNestedValue,
  removeFromGroup
} from './utils'

import { CommandItem } from './useCommandMenu'

export function useCommandHandling({
  activeInput,
  setActiveInput,
  activeFilters,
  onFilterChange,
  filterProperties,
  freeformText,
  onFreeformTextChange,
  handleInputChange,
  handleOperatorChange,
  setIsCommandMenuVisible,
  setDialogContent,
  setIsDialogOpen,
  setPendingPath,
  newPathRef,
  handleAIFilter,
  commandItems,
}: {
  activeInput: ActiveInput
  setActiveInput: (input: ActiveInput) => void
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  filterProperties: FilterProperty[]
  freeformText: string
  onFreeformTextChange: (text: string) => void
  handleInputChange: (path: number[], value: string) => void
  handleOperatorChange: (path: number[], value: string) => void
  setIsCommandMenuVisible: (visible: boolean) => void
  setDialogContent: (content: React.ReactElement | null) => void
  setIsDialogOpen: (open: boolean) => void
  setPendingPath: (path: number[] | null) => void
  newPathRef: React.MutableRefObject<number[]>
  handleAIFilter: () => void
  commandItems: CommandItem[]
}) {
  const removeFilterByPath = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const handleCommandSelect = useCallback((selectedValue: string) => {
    if (selectedValue === 'ai-filter') {
      handleAIFilter()
      return
    }

    if (selectedValue === 'group') {
      handleGroupCommand()
      return
    }

    if (activeInput?.type === 'value') {
      handleValueCommand(selectedValue)
    } else if (activeInput?.type === 'operator') {
      handleOperatorCommand(selectedValue)
    } else if (activeInput?.type === 'group') {
      handleGroupPropertyCommand(selectedValue)
    }
  }, [activeInput, activeFilters, filterProperties, freeformText, handleAIFilter, handleInputChange, handleOperatorChange])

  const handleGroupCommand = useCallback(() => {
    if (activeInput && activeInput.type === 'group') {
      const currentPath = activeInput.path
      const group = findGroupByPath(activeFilters, currentPath)
      if (!group) return

      const updatedFilters = addGroupToGroup(activeFilters, currentPath)
      onFilterChange(updatedFilters)
      newPathRef.current = [...currentPath, group.conditions.length]
      setTimeout(() => {
        setActiveInput({ type: 'group', path: newPathRef.current })
        setIsCommandMenuVisible(true)
      }, 0)
      onFreeformTextChange('')
    }
  }, [activeInput, activeFilters, onFilterChange, setActiveInput, setIsCommandMenuVisible, onFreeformTextChange])

  const handleValueCommand = useCallback((selectedValue: string) => {
    if (!activeInput || activeInput.type !== 'value') return
    
    const path = activeInput.path
    
    // Check if this is a custom option
    const customItem = commandItems.find(item => item.value === selectedValue && item.isCustom)
    if (customItem && customItem.customOption) {
      const element = customItem.customOption({
        onChange: (value: string) => {
          handleInputChange(path, value)
          setIsDialogOpen(false)
          setDialogContent(null)
          setPendingPath(null)
          setActiveInput({ type: 'group', path: path.slice(0, -1) })
        },
        onCancel: () => {
          removeFilterByPath(path)
          setIsDialogOpen(false)
          setDialogContent(null)
          setPendingPath(null)
          setActiveInput({ type: 'group', path: path.slice(0, -1) })
        },
        search: '',
      })
      setDialogContent(element)
      setIsDialogOpen(true)
      setPendingPath(path)
      setIsCommandMenuVisible(false)
      return
    }
    
    // Handle regular options
    handleInputChange(path, selectedValue)
    setTimeout(() => {
      setActiveInput({ type: 'group', path: path.slice(0, -1) })
      setIsCommandMenuVisible(true)
    }, 0)
  }, [activeInput, commandItems, handleInputChange, setActiveInput, setIsCommandMenuVisible, setDialogContent, setIsDialogOpen, setPendingPath, removeFilterByPath])

  const handleOperatorCommand = useCallback((selectedValue: string) => {
    if (!activeInput || activeInput.type !== 'operator') return
    
    const path = activeInput.path
    handleOperatorChange(path, selectedValue)
    setActiveInput(null)
  }, [activeInput, handleOperatorChange, setActiveInput])

  const handleGroupPropertyCommand = useCallback((selectedValue: string) => {
    if (!activeInput || activeInput.type !== 'group') return

    const selectedProperty = filterProperties.find((p) => p.name === selectedValue)
    if (!selectedProperty) {
      console.error(`Invalid property: ${selectedValue}`)
      return
    }

    const currentPath = activeInput.path
    const group = findGroupByPath(activeFilters, currentPath)
    if (!group) return

    // Check if the property itself is a custom option object
    if (
      selectedProperty.options &&
      !Array.isArray(selectedProperty.options) &&
      isCustomOptionObject(selectedProperty.options)
    ) {
      handleCustomPropertySelection(selectedProperty, currentPath, group)
    } else {
      handleNormalPropertySelection(selectedProperty, currentPath, group)
    }
    onFreeformTextChange('')
  }, [
    activeInput,
    filterProperties,
    activeFilters,
    onFilterChange,
    setIsCommandMenuVisible,
    onFreeformTextChange,
  ])

  const handleCustomPropertySelection = useCallback((
    selectedProperty: FilterProperty,
    currentPath: number[],
    group: FilterGroup
  ) => {
    const updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
    onFilterChange(updatedFilters)
    const newPath = [...currentPath, group.conditions.length]

    if (selectedProperty.options && isCustomOptionObject(selectedProperty.options)) {
      const element = selectedProperty.options.component({
        onChange: (value: string) => {
          const filterWithValue = updateNestedValue(updatedFilters, newPath, value)
          onFilterChange(filterWithValue)
          setIsDialogOpen(false)
          setDialogContent(null)
          setPendingPath(null)
          setActiveInput({ type: 'group', path: currentPath })
        },
        onCancel: () => {
          removeFilterByPath(newPath)
          setIsDialogOpen(false)
          setDialogContent(null)
          setPendingPath(null)
          setActiveInput({ type: 'group', path: currentPath })
        },
        search: '',
      })
      setDialogContent(element)
      setIsDialogOpen(true)
      setPendingPath(newPath)
      setIsCommandMenuVisible(false)
    }
  }, [
    activeFilters,
    onFilterChange,
    setDialogContent,
    setIsDialogOpen,
    setPendingPath,
    setActiveInput,
    setIsCommandMenuVisible,
    removeFilterByPath,
  ])

  const handleNormalPropertySelection = useCallback((
    selectedProperty: FilterProperty,
    currentPath: number[],
    group: FilterGroup
  ) => {
    const updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
    onFilterChange(updatedFilters)
    const newPath = [...currentPath, group.conditions.length]

    setTimeout(() => {
      setActiveInput({ type: 'value', path: newPath })
      setIsCommandMenuVisible(true)
    }, 0)
  }, [activeFilters, onFilterChange, setActiveInput, setIsCommandMenuVisible])

  return {
    handleCommandSelect,
  }
}