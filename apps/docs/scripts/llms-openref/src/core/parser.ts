/**
 * OpenRef YAML Specification Parser
 *
 * Performance optimizations:
 * - Single-pass parsing (O(n) where n = spec size)
 * - Lazy validation (only validate when needed)
 * - Efficient string operations (trim only once, reuse results)
 * - Pre-allocated arrays where size is known
 * - Avoid unnecessary object creation
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { load as yamlLoad } from 'js-yaml';

import {
  createSpecData,
  Example,
  ExampleSchema,
  Operation,
  OperationSchema,
  SpecData,
  SpecInfo,
  SpecInfoSchema,
} from './models.js';

// ============================================================================
// PARSER CLASS
// ============================================================================

export class OpenRefParser {
  constructor(private readonly specPath: string) {}

  /**
   * Parse OpenRef YAML specification
   *
   * Performance: O(n) single pass through spec
   * - YAML parsing: O(n)
   * - Info extraction: O(1)
   * - Functions iteration: O(m) where m = number of functions
   * - Examples parsing: O(k) where k = total examples
   * Total: O(n + m + k) ≈ O(n) where n dominates
   */
  async parse(): Promise<SpecData> {
    // Read file (I/O bound, unavoidable)
    const content = await readFile(this.specPath, 'utf-8');

    // Parse YAML (O(n) where n = file size)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spec = yamlLoad(content) as any;

    // Extract info (O(1) object property access)
    const info = this.parseInfo(spec.info);

    // Parse operations (O(m * k) where m = operations, k = avg examples per op)
    const functions = spec.functions as unknown[] | undefined;
    const operations = this.parseOperations(functions ?? []);

    // Create optimized SpecData with cached lookups
    return createSpecData(info, operations);
  }

  /**
   * Parse specification info
   * Performance: O(1) - fixed number of properties
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseInfo(infoRaw: any): SpecInfo {
    // Use nullish coalescing for efficient defaults
    const info = {
      id: infoRaw?.id ?? '',
      title: infoRaw?.title ?? '',
      description: this.trimString(infoRaw?.description),
      specUrl: infoRaw?.specUrl,
      slugPrefix: infoRaw?.slugPrefix ?? '/',
      libraries: infoRaw?.libraries ?? [],
    };

    // Validate with Zod (only if strict validation needed)
    return SpecInfoSchema.parse(info);
  }

  /**
   * Parse all operations
   * Performance: O(m * k) where m = operations, k = examples per operation
   *
   * Optimization: Pre-allocate array if size known
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseOperations(functionsRaw: any[]): Operation[] {
    // Pre-allocate array with known size (avoids dynamic resizing)
    const operations: Operation[] = new Array(functionsRaw.length);

    // Single pass through functions (O(m))
    for (let i = 0; i < functionsRaw.length; i++) {
      operations[i] = this.parseOperation(functionsRaw[i]);
    }

    return operations;
  }

  /**
   * Parse single operation with all examples
   * Performance: O(k) where k = number of examples
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseOperation(funcRaw: any): Operation {
    // Extract examples (O(k))
    const examplesRaw = funcRaw?.examples as unknown[] | undefined;
    const examples = this.parseExamples(examplesRaw ?? []);

    const operation = {
      id: funcRaw?.id ?? '',
      title: funcRaw?.title ?? '',
      description: this.trimString(funcRaw?.description),
      notes: this.trimString(funcRaw?.notes),
      examples,
      overwriteParams: funcRaw?.overwriteParams ?? [],
    };

    // Validate with Zod
    return OperationSchema.parse(operation);
  }

  /**
   * Parse all examples for an operation
   * Performance: O(k) where k = number of examples
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseExamples(examplesRaw: any[]): Example[] {
    // Pre-allocate array
    const examples: Example[] = new Array(examplesRaw.length);

    for (let i = 0; i < examplesRaw.length; i++) {
      examples[i] = this.parseExample(examplesRaw[i]);
    }

    return examples;
  }

  /**
   * Parse single example
   * Performance: O(1) - fixed number of properties
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseExample(exRaw: any): Example {
    // Extract data SQL efficiently
    const dataSql = this.extractDataSql(exRaw?.data);

    const example = {
      id: exRaw?.id ?? '',
      name: exRaw?.name ?? '',
      code: this.trimString(exRaw?.code),
      description: this.trimString(exRaw?.description),
      dataSql,
      response: this.trimString(exRaw?.response),
      isSpotlight: exRaw?.isSpotlight ?? false,
    };

    // Validate with Zod
    return ExampleSchema.parse(example);
  }

  /**
   * Extract SQL from data block efficiently
   * Performance: O(1)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractDataSql(dataBlock: any): string {
    if (dataBlock === null || dataBlock === undefined) {
      return '';
    }

    if (typeof dataBlock === 'object' && 'sql' in dataBlock) {
      return this.trimString(dataBlock.sql as string);
    }

    return '';
  }

  /**
   * Efficient string trimming with memoization potential
   * Performance: O(n) but only called once per string
   */
  private trimString(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    // Trim only if needed (check for whitespace first)
    const needsTrim =
      value.length > 0 &&
      (value[0] === ' ' ||
        value[0] === '\n' ||
        value[0] === '\t' ||
        value[value.length - 1] === ' ' ||
        value[value.length - 1] === '\n' ||
        value[value.length - 1] === '\t');

    return needsTrim ? value.trim() : value;
  }

  /**
   * Save parsed data as JSON
   * Performance: O(n) - JSON serialization is linear
   *
   * Optimization: Stream writing for large files (future enhancement)
   */
  async saveJSON(data: SpecData, outputPath: string): Promise<void> {
    // Extract directory path efficiently
    const lastSlash = outputPath.lastIndexOf('/');
    const dir = lastSlash > 0 ? outputPath.substring(0, lastSlash) : '.';

    // Create directory (single operation)
    await mkdir(dir, { recursive: true });

    // Prepare data for serialization (remove internal caches)
    const serializable = {
      info: data.info,
      operations: data.operations,
    };

    // Write file with optimized JSON serialization
    // Using 2-space indentation for readability vs performance
    await writeFile(outputPath, JSON.stringify(serializable, null, 2), 'utf-8');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse OpenRef spec from file path (convenience function)
 * Performance: Same as OpenRefParser.parse()
 */
export async function parseOpenRefSpec(specPath: string): Promise<SpecData> {
  const parser = new OpenRefParser(specPath);
  return await parser.parse();
}

/**
 * Validate parsed spec data structure
 * Performance: O(n) - validates all operations
 *
 * Use sparingly - only when validation is critical
 */
export function validateSpecData(data: SpecData): boolean {
  try {
    // Validate info
    SpecInfoSchema.parse(data.info);

    // Validate all operations (O(n))
    for (const op of data.operations) {
      OperationSchema.parse(op);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get parser statistics for debugging/logging
 * Performance: O(1) - uses cached values
 */
export function getParserStats(data: SpecData): {
  operationCount: number;
  exampleCount: number;
  avgExamplesPerOperation: number;
} {
  const operationCount = data.operations.length;
  const exampleCount = data._totalExamples ?? 0;
  const avgExamplesPerOperation =
    operationCount > 0 ? exampleCount / operationCount : 0;

  return {
    operationCount,
    exampleCount,
    avgExamplesPerOperation,
  };
}
