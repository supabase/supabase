import { type AuthTemplateType, type KebabCase } from './EmailTemplates.types'

/**
 * Convert template title to URL-friendly slug
 * Shared function to ensure slug matching works correctly across multiple files
 * Necessary because TEMPLATES_SCHEMAS does not provide a slug for each template
 */
export const slugifyTitle = (title: string) => {
  return title.trim().replace(/\s+/g, '-').toLowerCase()
}

/* Convert upper camel case to lower kebab case  */
export const getAuthTemplateType = <T extends AuthTemplateType>(id: T) =>
  id.toLowerCase().replace(/_/g, '-') as KebabCase<T>
