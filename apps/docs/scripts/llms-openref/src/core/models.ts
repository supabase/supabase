/**
 * Core data models for Supabase LLM Documentation Generator
 *
 * Performance considerations:
 * - Zod schemas are created once and reused (O(1) schema lookup)
 * - Lazy validation only when needed
 * - Immutable data structures for safety
 * - Efficient property access patterns
 */

import { z } from 'zod';

// ============================================================================
// EXAMPLE SCHEMA
// ============================================================================

/**
 * Code example with optional SQL context and response data
 *
 * Performance: Minimal schema overhead, defaults handled efficiently
 */
export const ExampleSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().default(''),
  dataSql: z.string().default(''),
  response: z.string().default(''),
  isSpotlight: z.boolean().default(false),
});

export type Example = z.infer<typeof ExampleSchema>;

/**
 * Type guard for Example (O(1) check without full validation)
 */
export function isExample(obj: unknown): obj is Example {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'code' in obj
  );
}

// ============================================================================
// OPERATION SCHEMA
// ============================================================================

/**
 * API operation containing multiple code examples
 *
 * Performance: Array operations optimized with proper typing
 */
export const OperationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  notes: z.string().default(''),
  examples: z.array(ExampleSchema).default([]),
  overwriteParams: z.array(z.record(z.unknown())).default([]),
});

export type Operation = z.infer<typeof OperationSchema>;

/**
 * Type guard for Operation (O(1) check without full validation)
 */
export function isOperation(obj: unknown): obj is Operation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'examples' in obj &&
    Array.isArray((obj as Operation).examples)
  );
}

/**
 * Get spotlight examples efficiently (O(n) single pass)
 */
export function getSpotlightExamples(operation: Operation): Example[] {
  return operation.examples.filter((ex) => ex.isSpotlight);
}

/**
 * Count examples efficiently (O(1) array length access)
 */
export function getExampleCount(operation: Operation): number {
  return operation.examples.length;
}

// ============================================================================
// SPEC INFO SCHEMA
// ============================================================================

/**
 * Specification metadata from OpenRef format
 */
export const SpecInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  specUrl: z.string().optional(),
  slugPrefix: z.string().default('/'),
  libraries: z.array(z.record(z.string())).default([]),
});

export type SpecInfo = z.infer<typeof SpecInfoSchema>;

// ============================================================================
// SPEC DATA SCHEMA
// ============================================================================

/**
 * Complete parsed specification with all operations
 *
 * Performance:
 * - Pre-computed operation map for O(1) lookups
 * - Cached total examples count
 */
export interface SpecData {
  info: SpecInfo;
  operations: Operation[];
  _operationMap?: Map<string, Operation>; // Cached for O(1) lookup
  _totalExamples?: number; // Cached count
}

/**
 * Create SpecData with performance optimizations
 * Builds operation map for O(1) lookups vs O(n) linear search
 */
export function createSpecData(info: SpecInfo, operations: Operation[]): SpecData {
  // Pre-build operation map for efficient lookups (O(n) once vs O(n) per lookup)
  const operationMap = new Map<string, Operation>();
  let totalExamples = 0;

  for (const op of operations) {
    operationMap.set(op.id, op);
    totalExamples += op.examples.length;
  }

  return {
    info,
    operations,
    _operationMap: operationMap,
    _totalExamples: totalExamples,
  };
}

/**
 * Get operation by ID (O(1) with cached map vs O(n) linear search)
 */
export function getOperationById(
  specData: SpecData,
  operationId: string
): Operation | undefined {
  // Use cached map if available (O(1))
  if (specData._operationMap !== undefined) {
    return specData._operationMap.get(operationId);
  }

  // Fallback to linear search (O(n)) and build cache
  const op = specData.operations.find((o) => o.id === operationId);

  // Build cache for future lookups
  if (specData._operationMap === undefined) {
    specData._operationMap = new Map(
      specData.operations.map((o) => [o.id, o])
    );
  }

  return op;
}

/**
 * Get multiple operations by IDs (O(k) where k = ids.length, using cached map)
 * More efficient than multiple individual lookups
 */
export function getOperationsByIds(
  specData: SpecData,
  operationIds: string[]
): Operation[] {
  // Ensure map is built (O(n) once)
  if (specData._operationMap === undefined) {
    specData._operationMap = new Map(
      specData.operations.map((o) => [o.id, o])
    );
  }

  // Collect operations (O(k) where k = operationIds.length)
  const result: Operation[] = [];
  for (const id of operationIds) {
    const op = specData._operationMap.get(id);
    if (op !== undefined) {
      result.push(op);
    }
  }

  return result;
}

/**
 * Get total examples count (O(1) with cache)
 */
export function getTotalExamples(specData: SpecData): number {
  // Return cached value if available
  if (specData._totalExamples !== undefined) {
    return specData._totalExamples;
  }

  // Calculate and cache
  const total = specData.operations.reduce(
    (sum, op) => sum + op.examples.length,
    0
  );

  specData._totalExamples = total;
  return total;
}

/**
 * Check if operation exists (O(1) with cached map)
 */
export function hasOperation(specData: SpecData, operationId: string): boolean {
  return getOperationById(specData, operationId) !== undefined;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Operation categorization result for formatter
 * Using Map for O(1) category lookups vs object property access
 */
export type CategorizedOperations = Map<string, Operation[]>;

/**
 * Create empty categorized operations map
 */
export function createCategorizedOperations(): CategorizedOperations {
  return new Map();
}

/**
 * Add operation to category (O(1) map operations)
 */
export function addOperationToCategory(
  categorized: CategorizedOperations,
  category: string,
  operation: Operation
): void {
  const existing = categorized.get(category);

  if (existing !== undefined) {
    existing.push(operation);
  } else {
    categorized.set(category, [operation]);
  }
}

/**
 * Get operations for category with fallback (O(1) lookup)
 */
export function getOperationsForCategory(
  categorized: CategorizedOperations,
  category: string
): Operation[] {
  return categorized.get(category) ?? [];
}
