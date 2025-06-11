import type { Span } from '../types/trace'

// Interface for a span with layout information
export interface LayoutSpan extends Span {
  depth: number // Indentation level (parent-child relationship)
  row: number // Vertical position within its depth level (for stacking overlapping spans)
  children: LayoutSpan[] // Child spans
  parent?: LayoutSpan // Parent span
}

/**
 * Builds a hierarchical tree of spans based on parent-child relationships
 * A span is considered a child of another span if:
 * 1. It starts at or after the parent's start time
 * 2. It ends at or before the parent's end time
 * 3. There's no other span that better fits as a parent
 */
export function buildSpanTree(spans: Span[]): LayoutSpan[] {
  // Sort spans by start time, then by end time (longer spans first)
  const sortedSpans = [...spans].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime
    return b.endTime - a.endTime // Longer spans first for same start time
  })

  // Convert to LayoutSpans
  const layoutSpans: LayoutSpan[] = sortedSpans.map((span) => ({
    ...span,
    depth: 0,
    row: 0,
    children: [],
  }))

  // Find the root spans (those with no parent)
  const rootSpans: LayoutSpan[] = []

  // For each span, find its parent
  for (const span of layoutSpans) {
    // Find the best parent for this span
    let bestParent: LayoutSpan | undefined = undefined
    let bestParentTimeRange = Number.POSITIVE_INFINITY

    for (const potentialParent of layoutSpans) {
      // Skip if this is the same span
      if (potentialParent.id === span.id) continue

      // Check if this span fits within the potential parent's time range
      if (span.startTime >= potentialParent.startTime && span.endTime <= potentialParent.endTime) {
        // Calculate how much of the potential parent's time range this span takes up
        const parentTimeRange = potentialParent.endTime - potentialParent.startTime

        // If this is a better fit than the current best parent, update
        if (parentTimeRange < bestParentTimeRange) {
          bestParent = potentialParent
          bestParentTimeRange = parentTimeRange
        }
      }
    }

    // If we found a parent, add this span as a child
    if (bestParent) {
      span.parent = bestParent
      bestParent.children.push(span)
    } else {
      // If no parent was found, this is a root span
      rootSpans.push(span)
    }
  }

  // Calculate depth for each span
  calculateDepth(rootSpans, 0)

  return layoutSpans
}

/**
 * Recursively calculates the depth (indentation level) for each span
 */
function calculateDepth(spans: LayoutSpan[], depth: number) {
  for (const span of spans) {
    span.depth = depth
    calculateDepth(span.children, depth + 1)
  }
}

/**
 * Groups spans by their depth level
 */
function groupSpansByDepth(spans: LayoutSpan[]): Record<number, LayoutSpan[]> {
  const spansByDepth: Record<number, LayoutSpan[]> = {}

  for (const span of spans) {
    if (!spansByDepth[span.depth]) {
      spansByDepth[span.depth] = []
    }
    spansByDepth[span.depth].push(span)
  }

  return spansByDepth
}

/**
 * Assigns rows to spans at the same depth level to prevent time overlaps
 */
function assignRowsWithinDepth(spans: LayoutSpan[]): void {
  // Sort spans by start time
  spans.sort((a, b) => a.startTime - b.startTime)

  // Track the end time of the last span in each row
  const rowEndTimes: number[] = []

  // Assign each span to the first available row
  for (const span of spans) {
    let rowIndex = 0

    // Find the first row where this span doesn't overlap with existing spans
    while (rowIndex < rowEndTimes.length && span.startTime < rowEndTimes[rowIndex]) {
      rowIndex++
    }

    // Assign the span to this row
    span.row = rowIndex

    // Update the end time for this row
    rowEndTimes[rowIndex] = span.endTime
  }
}

/**
 * Main layout function that processes spans and returns them with layout information
 */
export function layoutSpans(spans: Span[]): LayoutSpan[] {
  // Build the span tree
  const layoutSpans = buildSpanTree(spans)

  // Group spans by depth
  const spansByDepth = groupSpansByDepth(layoutSpans)

  // For each depth level, assign rows to prevent overlaps
  for (const depth in spansByDepth) {
    assignRowsWithinDepth(spansByDepth[depth])
  }

  return layoutSpans
}

/**
 * Calculate the total number of rows needed for the timeline
 */
export function calculateTotalRows(layoutSpans: LayoutSpan[]): number {
  // Group spans by depth
  const spansByDepth = groupSpansByDepth(layoutSpans)

  let totalRows = 0

  // For each depth level, find the maximum row
  for (const depth in spansByDepth) {
    const maxRow = Math.max(...spansByDepth[depth].map((span) => span.row))
    totalRows += maxRow + 1 // +1 because rows are 0-indexed
  }

  return totalRows
}

/**
 * Calculate the absolute row position for a span
 * This converts the relative row within a depth level to an absolute position
 */
export function calculateAbsoluteRow(span: LayoutSpan, layoutSpans: LayoutSpan[]): number {
  // Group spans by depth
  const spansByDepth = groupSpansByDepth(layoutSpans)

  let rowOffset = 0

  // Add up all rows from previous depth levels
  for (let d = 0; d < span.depth; d++) {
    if (spansByDepth[d]) {
      const maxRow = Math.max(...spansByDepth[d].map((s) => s.row))
      rowOffset += maxRow + 1 // +1 because rows are 0-indexed
    }
  }

  // Add the span's row within its depth level
  return rowOffset + span.row
}

// Keep the parent-child relationship tracking for the details panel,
// but don't use depth for horizontal positioning

// The buildSpanTree and calculateDepth functions can remain as they are,
// as they're still useful for tracking relationships.

// Just ensure we're not using depth for horizontal positioning anywhere.
