/**
 * HTTP Spec Fetcher with Caching
 *
 * Performance optimizations:
 * - Uses undici (faster than node-fetch)
 * - File system cache to avoid repeated downloads
 * - Efficient path operations
 * - Connection pooling via undici
 */

import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { request } from 'undici';

import type { ConfigLoader } from '../config/loader.js';
import { info, warn, error as logError } from './logger.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const FETCH_TIMEOUT = 30000; // 30 seconds
const USER_AGENT = 'supabase-llm-docs/1.0.0';

// ============================================================================
// FETCHER FUNCTIONS
// ============================================================================

/**
 * Fetch specification file with caching
 * Performance: O(1) cache hit, O(n) cache miss (network bound)
 *
 * @param sdkName - SDK name (e.g., 'javascript', 'swift')
 * @param version - Version string (e.g., 'v2', 'latest')
 * @param config - Configuration loader
 * @param forceDownload - Force download even if cached
 * @returns Tuple of [specPath, resolvedVersion]
 */
export async function fetchSpec(
  sdkName: string,
  version: string,
  config: ConfigLoader,
  forceDownload = false
): Promise<[string, string]> {
  // Get version config
  const versionConfig = config.getSDKVersionConfig(sdkName, version);

  // Resolve 'latest' to actual version for caching
  let actualVersion = version;
  if (version === 'latest') {
    const versions = config.getSDKVersions(sdkName);
    actualVersion = versions[0] ?? 'v1';
  }

  // Check for local path override
  if (versionConfig.spec.localPath !== null && !forceDownload) {
    const localPath = versionConfig.spec.localPath;

    if (existsSync(localPath)) {
      info(`Using local spec: ${localPath}`);
      return [localPath, actualVersion];
    }

    warn(`Local path specified but not found: ${localPath}`);
  }

  // Build cache path
  const cacheDir = 'config';
  const cacheFileName = `supabase_${sdkName}_${actualVersion}.yml`;
  const cachePath = `${cacheDir}/${cacheFileName}`;

  // Check cache (unless force download)
  if (!forceDownload && existsSync(cachePath)) {
    info(`Using cached spec: ${cachePath}`);
    return [cachePath, actualVersion];
  }

  // Download from URL
  const specUrl = versionConfig.spec.url;
  info(`Fetching spec from: ${specUrl}`);

  try {
    const content = await downloadFile(specUrl, FETCH_TIMEOUT);

    // Ensure cache directory exists
    await mkdir(cacheDir, { recursive: true });

    // Write to cache
    await writeFile(cachePath, content, 'utf-8');

    info(`Spec downloaded and cached: ${cachePath}`);
    return [cachePath, actualVersion];
  } catch (err) {
    logError(`Failed to fetch spec from ${specUrl}: ${String(err)}`);
    throw new Error(`Failed to fetch spec: ${String(err)}`);
  }
}

/**
 * Download file from URL using undici
 * Performance: O(n) where n = file size (network bound)
 *
 * Undici is significantly faster than node-fetch:
 * - Connection pooling
 * - Better HTTP/1.1 pipelining
 * - Lower memory overhead
 */
async function downloadFile(url: string, timeout: number): Promise<string> {
  const response = await request(url, {
    method: 'GET',
    headersTimeout: timeout,
    bodyTimeout: timeout,
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}: ${response.statusCode}`);
  }

  // Read body efficiently
  const body = await response.body.text();

  return body;
}

/**
 * Check if spec is cached
 * Performance: O(1) - file existence check
 */
export function isSpecCached(sdkName: string, version: string): boolean {
  const cacheFileName = `supabase_${sdkName}_${version}.yml`;
  const cachePath = `config/${cacheFileName}`;

  return existsSync(cachePath);
}

/**
 * Get cached spec path (does not download)
 * Performance: O(1)
 */
export function getCachedSpecPath(sdkName: string, version: string): string | null {
  const cacheFileName = `supabase_${sdkName}_${version}.yml`;
  const cachePath = `config/${cacheFileName}`;

  return existsSync(cachePath) ? cachePath : null;
}

/**
 * Download spec to specific path (advanced usage)
 * Performance: O(n) where n = file size
 */
export async function downloadSpecTo(url: string, outputPath: string): Promise<void> {
  info(`Downloading from ${url} to ${outputPath}`);

  try {
    const content = await downloadFile(url, FETCH_TIMEOUT);

    // Extract directory from path
    const lastSlash = outputPath.lastIndexOf('/');
    const dir = lastSlash > 0 ? outputPath.substring(0, lastSlash) : '.';

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(outputPath, content, 'utf-8');

    info(`Downloaded successfully: ${outputPath}`);
  } catch (err) {
    logError(`Download failed: ${String(err)}`);
    throw err;
  }
}

/**
 * Clear spec cache
 * Performance: O(n) where n = number of cached files
 */
export async function clearSpecCache(sdkName?: string, version?: string): Promise<number> {
  const cacheDir = 'config';

  if (sdkName !== undefined && version !== undefined) {
    // Clear specific cache file
    const cacheFileName = `supabase_${sdkName}_${version}.yml`;
    const cachePath = `${cacheDir}/${cacheFileName}`;

    if (existsSync(cachePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(cachePath);
      return 1;
    }

    return 0;
  }

  // Clear all cache files
  const { readdir, unlink } = await import('fs/promises');

  if (!existsSync(cacheDir)) {
    return 0;
  }

  const files = await readdir(cacheDir);
  const cacheFiles = files.filter(
    (f) => f.startsWith('supabase_') && f.endsWith('.yml')
  );

  let deletedCount = 0;
  for (const file of cacheFiles) {
    await unlink(`${cacheDir}/${file}`);
    deletedCount++;
  }

  return deletedCount;
}
