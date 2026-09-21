import { BASE_PATH } from '@/lib/constants'

/**
 * Brand mark paths shared by Pipelines (`DestinationLogo`) and Integrations
 * Wrappers. A single string is theme-agnostic; `{ light, dark }` opts into
 * per-theme assets.
 *
 * Wrappers / `IntegrationLogo` force a white tile, so they should always use
 * {@link resolveLightIconSrc}. DestinationLogo sits on `bg-surface-100` and
 * should resolve against the active theme.
 */
export type ThemedIconSrc = string | { light: string; dark: string }

export const BRAND_ICONS = {
  bigquery: `${BASE_PATH}/img/icons/bigquery-icon.svg`,
  clickhouse: {
    light: `${BASE_PATH}/img/icons/clickhouse-icon.svg`,
    dark: `${BASE_PATH}/img/icons/clickhouse-icon-dark.svg`,
  },
  ducklake: {
    light: `${BASE_PATH}/img/icons/ducklake-icon-light.svg`,
    dark: `${BASE_PATH}/img/icons/ducklake-icon.svg`,
  },
  snowflake: `${BASE_PATH}/img/icons/snowflake-icon.svg`,
} as const satisfies Record<string, ThemedIconSrc>

export function resolveThemedIconSrc(src: ThemedIconSrc, isDark: boolean): string {
  if (typeof src === 'string') return src
  return isDark ? src.dark : src.light
}

/** Light (or only) variant — for surfaces that force a white logo tile. */
export function resolveLightIconSrc(src: ThemedIconSrc): string {
  return typeof src === 'string' ? src : src.light
}
