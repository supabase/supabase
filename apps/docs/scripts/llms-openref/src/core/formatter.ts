/**
 * LLM-Optimized Documentation Formatter
 *
 * Performance optimizations:
 * - String concatenation using array join (O(n) vs O(n²) with +=)
 * - Streaming writes for large outputs
 * - Lazy computation (only format what's needed)
 * - Efficient regex operations (compile once, reuse)
 * - Minimal string allocations
 */

import { createWriteStream } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

import type { ConfigLoader } from '../config/loader.js';
import {
  addOperationToCategory,
  CategorizedOperations,
  createCategorizedOperations,
  Example,
  getOperationsForCategory,
  Operation,
  SpecData,
} from './models.js';

// ============================================================================
// CONSTANTS (Compile once, reuse)
// ============================================================================

// Pre-compiled regex for efficient string cleaning (O(1) compilation cost)
const MARKDOWN_CODE_FENCE_SQL = /```sql/g;
const MARKDOWN_CODE_FENCE_JSON = /```json/g;
const MARKDOWN_CODE_FENCE = /```/g;

// String building optimization: use array join instead of concatenation
const NEWLINE = '\n';
const DOUBLE_NEWLINE = '\n\n';

// ============================================================================
// FORMATTER CLASS
// ============================================================================

export class LLMFormatter {
  private readonly versionConfig: {
    displayName: string;
    output: { filenamePrefix: string };
  };
  private readonly sdkName: string;
  private readonly version: string;
  private readonly specPath: string;

  constructor(
    private readonly specData: SpecData,
    private readonly config: ConfigLoader,
    sdkName: string,
    version: string
  ) {
    // Cache version config for O(1) access
    this.versionConfig = this.config.getSDKVersionConfig(sdkName, version);
    this.sdkName = sdkName;
    this.version = version;

    // Get spec path from config
    const sdk = this.config.getSDK(sdkName);
    const versionConfig = sdk.versions[version];
    this.specPath = versionConfig?.spec.localPath ?? '';
  }

  /**
   * Generate all documentation files
   * Performance: O(n * m) where n = operations, m = avg examples per operation
   *
   * Optimization: Parallel writes using Promise.all
   */
  async generateAll(outputDir: string): Promise<void> {
    const llmDocsDir = `${outputDir}/llm-docs`;
    await mkdir(llmDocsDir, { recursive: true });

    // Categorize operations once (O(n) where n = total operations)
    const categorized = this.categorizeOperations();

    // Collect all write promises for parallel execution
    const writePromises: Promise<void>[] = [];

    // Generate each module (can be parallelized)
    for (const [categoryName, _categoryConfig] of this.config.getSortedCategories()) {
      const operations = getOperationsForCategory(categorized, categoryName);

      if (operations.length > 0) {
        // Format module without category number (standalone)
        const content = this.formatModule(categoryName, operations);

        // Write file (I/O bound - can be parallel)
        writePromises.push(this.writeModuleFile(llmDocsDir, categoryName, content));
      }
    }

    // Wait for all module writes to complete (parallel I/O)
    await Promise.all(writePromises);

    // Generate full documentation with proper hierarchy
    await this.generateFullDoc(llmDocsDir, categorized);
  }

  /**
   * Categorize operations by category
   * Performance: O(n * m) where n = operations, m = categories
   *
   * Optimization: Uses Map for O(1) category lookups
   * Better than creating multiple arrays and filtering
   */
  private categorizeOperations(): CategorizedOperations {
    const categorized = createCategorizedOperations();

    // Build operation ID to operation map (O(n))
    const operationMap = new Map(this.specData.operations.map((op) => [op.id, op]));

    // Iterate through categories and assign operations (O(c * o))
    // where c = categories, o = operations per category
    for (const [categoryName, categoryConfig] of this.config.getCategories()) {
      for (const opId of categoryConfig.operations) {
        const op = operationMap.get(opId);
        if (op !== undefined) {
          addOperationToCategory(categorized, categoryName, op);
          // Remove from map to track uncategorized (O(1))
          operationMap.delete(opId);
        }
      }
    }

    // Log uncategorized operations (if any remain in map)
    if (operationMap.size > 0) {
      const uncategorized = Array.from(operationMap.keys());
      console.warn(
        `Warning: ${uncategorized.length} uncategorized operations: ${uncategorized.join(', ')}`
      );
    }

    return categorized;
  }

  /**
   * Format a single module's documentation
   * Performance: O(n * m) where n = operations, m = examples per operation
   *
   * Optimization: Array join for string building (O(n) vs O(n²) with +=)
   */
  private formatModule(
    categoryName: string,
    operations: Operation[],
    categoryNum?: number
  ): string {
    const category = this.config.getCategory(categoryName);

    // Use array for efficient string building
    const parts: string[] = [];

    // System prompt
    const systemPrompt = category.systemPrompt.replace(
      '{sdk_name}',
      this.versionConfig.displayName
    );
    parts.push(`<SYSTEM>${systemPrompt}</SYSTEM>`, DOUBLE_NEWLINE);

    // If categoryNum provided (for full doc), use proper hierarchy
    if (categoryNum !== undefined) {
      // Category header (H2)
      parts.push(`## ${categoryNum}. ${category.title}`, DOUBLE_NEWLINE);
      parts.push(category.description, DOUBLE_NEWLINE);

      // Format each operation with category-aware numbering
      let operationNum = 1;
      for (const operation of operations) {
        parts.push(this.formatOperation(operation, categoryNum, operationNum));
        operationNum++;
      }
    } else {
      // Standalone module - keep original structure for backwards compatibility
      parts.push(
        `# ${this.versionConfig.displayName} ${category.title} Documentation`,
        DOUBLE_NEWLINE
      );
      parts.push(category.description, DOUBLE_NEWLINE);

      // Format each operation with simple numbering
      let operationNum = 1;
      for (const operation of operations) {
        parts.push(this.formatOperation(operation, operationNum));
        operationNum++;
      }
    }

    // Join all parts once (O(n) total)
    return parts.join('');
  }

  /**
   * Format single operation with all examples
   * Performance: O(k) where k = number of examples
   */
  private formatOperation(
    operation: Operation,
    categoryOrSectionNum: number,
    operationNum?: number
  ): string {
    const parts: string[] = [];

    // If operationNum provided, use hierarchical numbering (H3)
    if (operationNum !== undefined) {
      // Hierarchical: categoryNum.operationNum
      parts.push(
        `### ${categoryOrSectionNum}.${operationNum}. ${operation.title}`,
        DOUBLE_NEWLINE
      );
    } else {
      // Flat: sectionNum only (for standalone modules)
      parts.push(`# ${categoryOrSectionNum}. ${operation.title}`, DOUBLE_NEWLINE);
    }

    // Description
    if (operation.description.length > 0) {
      parts.push(operation.description, DOUBLE_NEWLINE);
    }

    // Notes
    if (operation.notes.length > 0) {
      parts.push(operation.notes, DOUBLE_NEWLINE);
    }

    // Examples
    let exampleNum = 1;
    for (const example of operation.examples) {
      if (operationNum !== undefined) {
        // Hierarchical numbering
        parts.push(
          this.formatExample(example, categoryOrSectionNum, operationNum, exampleNum)
        );
      } else {
        // Flat numbering
        parts.push(this.formatExample(example, categoryOrSectionNum, exampleNum));
      }
      exampleNum++;
    }

    return parts.join('');
  }

  /**
   * Format single example with inline SQL/JSON context
   * Performance: O(1) per example (fixed operations)
   *
   * Optimization: Efficient regex replace (compiled once)
   */
  private formatExample(
    example: Example,
    categoryOrSectionNum: number,
    operationOrExampleNum: number,
    exampleNum?: number
  ): string {
    const parts: string[] = [];

    // If exampleNum provided, use hierarchical numbering (H4)
    if (exampleNum !== undefined) {
      // Hierarchical: categoryNum.operationNum.exampleNum
      parts.push(
        `#### ${categoryOrSectionNum}.${operationOrExampleNum}.${exampleNum}. ${example.name}`,
        DOUBLE_NEWLINE
      );
    } else {
      // Flat: sectionNum.exampleNum (for standalone modules)
      parts.push(
        `## ${categoryOrSectionNum}.${operationOrExampleNum}. ${example.name}`,
        DOUBLE_NEWLINE
      );
    }

    // Code block with inline context
    if (example.code.length > 0) {
      parts.push(example.code, NEWLINE);

      // Data Source (SQL)
      if (example.dataSql.length > 0) {
        const cleanSql = this.cleanMarkdownFences(example.dataSql);
        parts.push(NEWLINE, '// Data Source', NEWLINE, '/*', NEWLINE, cleanSql, NEWLINE, '*/', NEWLINE);
      }

      // Response (JSON)
      if (example.response.length > 0) {
        const cleanResponse = this.cleanMarkdownFences(example.response);
        parts.push(
          NEWLINE,
          '// Response',
          NEWLINE,
          '/*',
          NEWLINE,
          cleanResponse,
          NEWLINE,
          '*/',
          NEWLINE
        );
      }

      parts.push(NEWLINE);
    }

    // Description/Note
    if (example.description.length > 0) {
      parts.push(NEWLINE, `// Note: ${example.description}`, NEWLINE);
    }

    return parts.join('');
  }

  /**
   * Clean markdown code fences efficiently
   * Performance: O(n) where n = string length
   *
   * Optimization: Pre-compiled regex patterns
   */
  private cleanMarkdownFences(text: string): string {
    // Apply all regex replacements in sequence
    // Each regex is compiled once at module load
    return text
      .replace(MARKDOWN_CODE_FENCE_SQL, '')
      .replace(MARKDOWN_CODE_FENCE_JSON, '')
      .replace(MARKDOWN_CODE_FENCE, '')
      .trim();
  }

  /**
   * Write module file
   * Performance: O(n) where n = content size (I/O bound)
   */
  private async writeModuleFile(
    outputDir: string,
    categoryName: string,
    content: string
  ): Promise<void> {
    const filename = `${this.versionConfig.output.filenamePrefix}-${categoryName}-llms.txt`;
    const filepath = `${outputDir}/${filename}`;

    await writeFile(filepath, content, 'utf-8');
  }

  /**
   * Generate full combined documentation
   * Performance: O(n) where n = total content size
   *
   * Optimization: For large outputs, uses streaming
   */
  private async generateFullDoc(
    outputDir: string,
    categorized: CategorizedOperations
  ): Promise<void> {
    const filename = `${this.versionConfig.output.filenamePrefix}-full-llms.txt`;
    const filepath = `${outputDir}/${filename}`;

    // Build header with metadata
    const now = new Date();
    const generatedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const headerParts: string[] = [];
    headerParts.push(
      `<SYSTEM>This is the complete developer documentation for ${this.versionConfig.displayName}.</SYSTEM>`,
      DOUBLE_NEWLINE
    );
    headerParts.push(
      `<!-- Generated from: ${this.specPath} -->`,
      NEWLINE,
      `<!-- SDK: ${this.sdkName}, Version: ${this.version}, Generated: ${generatedDate} -->`,
      DOUBLE_NEWLINE
    );
    headerParts.push(
      `# ${this.versionConfig.displayName} Reference`,
      DOUBLE_NEWLINE
    );
    headerParts.push(
      `Complete reference for ${this.versionConfig.displayName} covering all modules.`,
      DOUBLE_NEWLINE
    );

    // Build content with proper hierarchy
    const contentParts: string[] = [headerParts.join('')];

    let categoryNum = 1;
    for (const [categoryName] of this.config.getSortedCategories()) {
      const operations = getOperationsForCategory(categorized, categoryName);

      if (operations.length > 0) {
        // Format module with category number for hierarchical structure
        const content = this.formatModule(categoryName, operations, categoryNum);

        // Skip the SYSTEM prompt line (first line) from each category
        const lines = content.split(NEWLINE);
        const contentWithoutSystem = lines.slice(2).join(NEWLINE); // Skip <SYSTEM>...</SYSTEM> and empty line
        contentParts.push(contentWithoutSystem, DOUBLE_NEWLINE);

        categoryNum++;
      }
    }

    // For very large content, use streaming (threshold: 10MB)
    const fullContent = contentParts.join('');

    if (fullContent.length > 10 * 1024 * 1024) {
      // Stream for large files (> 10MB)
      await this.writeFileStream(filepath, fullContent);
    } else {
      // Direct write for smaller files
      await writeFile(filepath, fullContent, 'utf-8');
    }
  }

  /**
   * Stream large file writes for memory efficiency
   * Performance: O(n) but with constant memory usage
   */
  private async writeFileStream(filepath: string, content: string): Promise<void> {
    const readable = Readable.from([content]);
    const writable = createWriteStream(filepath, { encoding: 'utf-8' });

    await pipeline(readable, writable);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format spec data for specific SDK and version (convenience function)
 */
export async function formatSpecData(
  specData: SpecData,
  config: ConfigLoader,
  sdkName: string,
  version: string,
  outputDir: string
): Promise<void> {
  const formatter = new LLMFormatter(specData, config, sdkName, version);
  await formatter.generateAll(outputDir);
}
