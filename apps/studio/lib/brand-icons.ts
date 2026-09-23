import { BASE_PATH } from '@/lib/constants'

export type ThemedIconSrc = string | { light: string; dark: string }

export const BRAND_ICONS = {
  bigquery: `${BASE_PATH}/img/icons/bigquery-icon.svg`,
  clickhouse: {
    light: `${BASE_PATH}/img/icons/clickhouse-icon-light.svg`,
    dark: `${BASE_PATH}/img/icons/clickhouse-icon.svg`,
  },
  ducklake: `${BASE_PATH}/img/icons/ducklake-icon.svg`,
  snowflake: `${BASE_PATH}/img/icons/snowflake-icon.svg`,
} as const satisfies Record<string, ThemedIconSrc>

export function resolveThemedIconSrc(src: ThemedIconSrc, isDark: boolean): string {
  if (typeof src === 'string') return src
  return isDark ? src.dark : src.light
}
