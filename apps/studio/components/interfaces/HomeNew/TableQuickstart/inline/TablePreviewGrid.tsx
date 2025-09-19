import { motion } from 'framer-motion'
import { cn } from 'ui'
import { TablePickerSkeleton } from '../legacy/TablePickerSkeleton'
import { TablePicker } from '../legacy/TablePicker'
import type { TableSuggestion } from '../legacy/types'
import { itemVariants } from './animations'

interface TablePreviewGridProps {
  tables: TableSuggestion[]
  onSelectTable: (table: TableSuggestion) => void
  loading: boolean
  isGenerating: boolean
}

export function TablePreviewGrid({
  tables,
  onSelectTable,
  loading,
  isGenerating,
}: TablePreviewGridProps) {
  if (isGenerating) {
    return (
      <motion.div variants={itemVariants}>
        <TablePickerSkeleton />
      </motion.div>
    )
  }

  if (tables.length === 0) {
    return null
  }

  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-sm text-foreground-light">Select a table to create:</p>
      <TablePicker tables={tables} onSelectTable={onSelectTable} loading={loading} />
    </motion.div>
  )
}