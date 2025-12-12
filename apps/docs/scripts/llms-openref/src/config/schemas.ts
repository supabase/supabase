/**
 * Configuration validation schemas using Zod
 *
 * Performance considerations:
 * - Schemas compiled once at module load
 * - Validation is opt-in (lazy) where possible
 * - Type inference from schemas (zero runtime cost)
 */

import { z } from 'zod';

// ============================================================================
// SDK CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Specification source configuration
 */
export const SpecConfigSchema = z.object({
  url: z.string().url(),
  localPath: z.string().nullable(),
  format: z.string().default('openref-0.1'),
});

export type SpecConfig = z.infer<typeof SpecConfigSchema>;

/**
 * Output configuration for generated docs
 */
export const OutputConfigSchema = z.object({
  baseDir: z.string(),
  filenamePrefix: z.string(),
});

export type OutputConfig = z.infer<typeof OutputConfigSchema>;

/**
 * SDK version configuration
 */
export const SDKVersionConfigSchema = z.object({
  displayName: z.string(),
  spec: SpecConfigSchema,
  output: OutputConfigSchema,
});

export type SDKVersionConfig = z.infer<typeof SDKVersionConfigSchema>;

/**
 * SDK configuration with multiple versions
 */
export const SDKConfigSchema = z.object({
  name: z.string(),
  language: z.string(),
  versions: z.record(z.string(), SDKVersionConfigSchema),
});

export type SDKConfig = z.infer<typeof SDKConfigSchema>;

/**
 * Root SDKs configuration file
 */
export const SDKsConfigSchema = z.object({
  sdks: z.record(z.string(), SDKConfigSchema),
});

export type SDKsConfig = z.infer<typeof SDKsConfigSchema>;

// ============================================================================
// CATEGORY CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Documentation category configuration
 */
export const CategoryConfigSchema = z.object({
  title: z.string(),
  description: z.string(),
  systemPrompt: z.string(),
  operations: z.array(z.string()),
  order: z.number().int().positive(),
});

export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;

/**
 * Root categories configuration file
 */
export const CategoriesConfigSchema = z.object({
  categories: z.record(z.string(), CategoryConfigSchema),
});

export type CategoriesConfig = z.infer<typeof CategoriesConfigSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate SDK configuration without throwing
 * Performance: O(1) for structure validation
 */
export function validateSDKConfig(data: unknown): {
  success: boolean;
  data?: SDKConfig;
  error?: string;
} {
  try {
    const result = SDKConfigSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate category configuration without throwing
 * Performance: O(1) for structure validation
 */
export function validateCategoryConfig(data: unknown): {
  success: boolean;
  data?: CategoryConfig;
  error?: string;
} {
  try {
    const result = CategoryConfigSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}
