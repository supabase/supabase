/**
 * Configuration Loader with Caching
 *
 * Performance optimizations:
 * - Lazy loading (load only when accessed)
 * - Cached lookups using Map (O(1) vs O(n) array search)
 * - Single file read per config file
 * - Pre-computed sorted categories
 */

import { readFile } from 'fs/promises';

import {
  CategoriesConfigSchema,
  CategoryConfig,
  SDKConfig,
  SDKsConfigSchema,
  SDKVersionConfig,
} from './schemas.js';

// ============================================================================
// CONFIG LOADER CLASS
// ============================================================================

export class ConfigLoader {
  // Lazy-loaded caches (O(1) lookups)
  private sdksCache: Map<string, SDKConfig> | null = null;
  private categoriesCache: Map<string, CategoryConfig> | null = null;
  private sortedCategoriesCache: [string, CategoryConfig][] | null = null;

  constructor(private readonly configDir: string) {}

  /**
   * Load all configuration files
   * Performance: O(n + m) where n = SDKs, m = categories
   *
   * Only loads once, subsequent calls return cached data
   */
  async load(): Promise<void> {
    // Parallel loading for better performance (I/O bound)
    await Promise.all([this.loadSDKs(), this.loadCategories()]);
  }

  /**
   * Load SDKs configuration
   * Performance: O(n) where n = number of SDKs
   * Builds Map for O(1) lookups
   */
  private async loadSDKs(): Promise<void> {
    if (this.sdksCache !== null) {
      return; // Already loaded
    }

    const content = await readFile(`${this.configDir}/sdks.json`, 'utf-8');
    const data = JSON.parse(content) as unknown;

    // Validate with Zod
    const validated = SDKsConfigSchema.parse(data);

    // Build Map for O(1) lookups (better than object property access)
    this.sdksCache = new Map(Object.entries(validated.sdks));
  }

  /**
   * Load categories configuration
   * Performance: O(m) where m = number of categories
   */
  private async loadCategories(): Promise<void> {
    if (this.categoriesCache !== null) {
      return; // Already loaded
    }

    const content = await readFile(`${this.configDir}/categories.json`, 'utf-8');
    const data = JSON.parse(content) as unknown;

    // Validate with Zod
    const validated = CategoriesConfigSchema.parse(data);

    // Build Map for O(1) lookups
    this.categoriesCache = new Map(Object.entries(validated.categories));

    // Pre-compute sorted categories (O(m log m) once)
    this.sortedCategoriesCache = Array.from(this.categoriesCache.entries()).sort(
      (a, b) => a[1].order - b[1].order
    );
  }

  /**
   * Get SDK configuration by name
   * Performance: O(1) map lookup
   */
  getSDK(name: string): SDKConfig {
    if (this.sdksCache === null) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const sdk = this.sdksCache.get(name);
    if (sdk === undefined) {
      throw new Error(`SDK '${name}' not found in configuration`);
    }

    return sdk;
  }

  /**
   * Get all SDK names
   * Performance: O(n) to convert Map keys to array
   */
  getAllSDKs(): string[] {
    if (this.sdksCache === null) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return Array.from(this.sdksCache.keys());
  }

  /**
   * Get SDK version configuration
   * Performance: O(1) map lookup + O(1) object property access
   */
  getSDKVersionConfig(sdkName: string, version: string): SDKVersionConfig {
    const sdk = this.getSDK(sdkName);

    // Resolve 'latest' to actual version
    let actualVersion = version;
    if (version === 'latest') {
      actualVersion = this.getLatestVersion(sdk);
    }

    const versionConfig = sdk.versions[actualVersion];
    if (versionConfig === undefined) {
      const available = Object.keys(sdk.versions).join(', ');
      throw new Error(
        `Version '${version}' not found for SDK '${sdkName}'. Available: ${available}`
      );
    }

    return versionConfig;
  }

  /**
   * Get latest version for SDK
   * Performance: O(n) where n = number of versions
   *
   * Heuristic: Highest version number (v2 > v1)
   */
  private getLatestVersion(sdk: SDKConfig): string {
    const versions = Object.keys(sdk.versions);

    if (versions.length === 0) {
      throw new Error(`SDK '${sdk.name}' has no versions configured`);
    }

    // Sort versions by number (extract v1, v2, etc.)
    const sorted = versions.sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return bNum - aNum; // Descending order
    });

    return sorted[0]!;
  }

  /**
   * Get all versions for SDK
   * Performance: O(n) where n = versions
   */
  getSDKVersions(sdkName: string): string[] {
    const sdk = this.getSDK(sdkName);
    return Object.keys(sdk.versions);
  }

  /**
   * Get category configuration
   * Performance: O(1) map lookup
   */
  getCategory(name: string): CategoryConfig {
    if (this.categoriesCache === null) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const category = this.categoriesCache.get(name);
    if (category === undefined) {
      throw new Error(`Category '${name}' not found in configuration`);
    }

    return category;
  }

  /**
   * Get all categories
   * Performance: O(1) - returns cached Map
   */
  getCategories(): ReadonlyMap<string, CategoryConfig> {
    if (this.categoriesCache === null) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.categoriesCache;
  }

  /**
   * Get sorted categories by order
   * Performance: O(1) - returns pre-computed sorted array
   */
  getSortedCategories(): ReadonlyArray<[string, CategoryConfig]> {
    if (this.sortedCategoriesCache === null) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.sortedCategoriesCache;
  }

  /**
   * Get operations for category
   * Performance: O(1) map lookup + O(1) array access
   */
  getOperationsForCategory(categoryName: string): readonly string[] {
    const category = this.getCategory(categoryName);
    return category.operations;
  }

  /**
   * Check if SDK exists
   * Performance: O(1) map has check
   */
  hasSDK(name: string): boolean {
    if (this.sdksCache === null) {
      return false;
    }

    return this.sdksCache.has(name);
  }

  /**
   * Check if category exists
   * Performance: O(1) map has check
   */
  hasCategory(name: string): boolean {
    if (this.categoriesCache === null) {
      return false;
    }

    return this.categoriesCache.has(name);
  }

  /**
   * Get all SDK-version pairs
   * Performance: O(n * m) where n = SDKs, m = avg versions per SDK
   */
  getAllSDKVersionPairs(): Array<[string, string]> {
    if (this.sdksCache === null) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const pairs: Array<[string, string]> = [];

    for (const [sdkName, sdk] of this.sdksCache) {
      for (const version of Object.keys(sdk.versions)) {
        pairs.push([sdkName, version]);
      }
    }

    return pairs;
  }

  /**
   * Clear all caches (for testing/reloading)
   * Performance: O(1)
   */
  clearCache(): void {
    this.sdksCache = null;
    this.categoriesCache = null;
    this.sortedCategoriesCache = null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create and load configuration (convenience function)
 */
export async function loadConfig(configDir: string): Promise<ConfigLoader> {
  const loader = new ConfigLoader(configDir);
  await loader.load();
  return loader;
}
