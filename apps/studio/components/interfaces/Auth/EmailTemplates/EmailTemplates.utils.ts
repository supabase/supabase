import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import { type AuthTemplateType, type KebabCase } from './EmailTemplates.types'
import type { components } from '@/data/api'
import type { Organization } from '@/types'

dayjs.extend(utc)

type AuthConfig = components['schemas']['GoTrueConfigResponse']

/**
 * Projects created on or after this date are subject to the free-tier template editing
 * restriction. Projects created before it are grandfathered and keep editing access.
 * Must stay in sync with FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE in the platform.
 */
export const FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE = '2026-06-03T00:00:00Z'

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

export const hasCustomEmailSender = (config?: Partial<AuthConfig>) => {
  const hasSendEmailHook = !!config?.HOOK_SEND_EMAIL_ENABLED && !!config?.HOOK_SEND_EMAIL_URI

  return isSmtpEnabled(config) || hasSendEmailHook
}

export const isCustomEmailTemplateRestrictionStatusKnown = ({
  authConfig,
  organization,
  projectInsertedAt,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
  projectInsertedAt?: string
}) => {
  return authConfig !== undefined && organization !== undefined && projectInsertedAt !== undefined
}

export const isBeforeFreeTierTemplateBlockCutoff = (projectInsertedAt?: string) => {
  return dayjs.utc(projectInsertedAt).isBefore(FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE)
}

export const isCustomEmailTemplateEditingRestricted = ({
  authConfig,
  organization,
  projectInsertedAt,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
  projectInsertedAt?: string
}) => {
  const isPaidPlan = organization?.plan?.id !== undefined && organization.plan.id !== 'free'
  if (isPaidPlan) return false

  // Grandfathering: projects created before the cutoff date keep editing access.
  // Mirrors FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE enforcement in the platform.
  if (projectInsertedAt && isBeforeFreeTierTemplateBlockCutoff(projectInsertedAt)) {
    return false
  }

  // Temporary Studio-side paygate while Platform/Auth own the exact eligibility cohort.
  return !hasCustomEmailSender(authConfig)
}

export type TemplateValidationError = {
  valid: boolean
  error?: string
}

/**
 * Validates a Go template string (html/template or text/template syntax used by GoTrue/Supabase Auth).
 * Returns { valid: true } if valid, or { valid: false, error: string } if syntax is invalid.
 */
export const validateGoTemplate = (template: string): TemplateValidationError => {
  if (!template) return { valid: true }

  let i = 0
  const n = template.length
  const blockStack: { type: string; action: string }[] = []

  while (i < n) {
    const openIdx = template.indexOf('{{', i)
    if (openIdx === -1) {
      break
    }

    let actionStart = openIdx + 2
    if (actionStart < n && template[actionStart] === '-') {
      actionStart++
    }

    // Check for comment starting with /* immediately after {{ or {{-
    const trimmedFromAction = template.slice(actionStart).trimStart()
    if (trimmedFromAction.startsWith('/*')) {
      const commentClose = template.indexOf('*/', actionStart)
      if (commentClose === -1) {
        return { valid: false, error: 'Unclosed comment in template action' }
      }
      const closeDelim = template.indexOf('}}', commentClose + 2)
      if (closeDelim === -1) {
        return { valid: false, error: 'Unclosed template action "{{ ... }}"' }
      }
      i = closeDelim + 2
      continue
    }

    // Scan for closing }} or -}}
    let actionEnd = -1
    let inDoubleQuote = false
    let inRawQuote = false
    let inComment = false
    let j = actionStart

    while (j < n) {
      const char = template[j]
      const nextChar = template[j + 1]

      if (inComment) {
        if (char === '*' && nextChar === '/') {
          inComment = false
          j += 2
          continue
        }
        j++
        continue
      }

      if (inDoubleQuote) {
        if (char === '\\') {
          j += 2
          continue
        }
        if (char === '"') {
          inDoubleQuote = false
        }
        j++
        continue
      }

      if (inRawQuote) {
        if (char === '`') {
          inRawQuote = false
        }
        j++
        continue
      }

      if (char === '"') {
        inDoubleQuote = true
        j++
        continue
      }

      if (char === '`') {
        inRawQuote = true
        j++
        continue
      }

      if (char === '/' && nextChar === '*') {
        inComment = true
        j += 2
        continue
      }

      if (char === '}' && nextChar === '}') {
        actionEnd = j
        break
      }
      if (char === '-' && nextChar === '}' && template[j + 2] === '}') {
        actionEnd = j
        break
      }

      j++
    }

    if (inDoubleQuote) {
      return { valid: false, error: 'Unclosed string literal in template action' }
    }
    if (inRawQuote) {
      return { valid: false, error: 'Unclosed raw string literal in template action' }
    }
    if (inComment) {
      return { valid: false, error: 'Unclosed comment in template action' }
    }
    if (actionEnd === -1) {
      return { valid: false, error: 'Unclosed template action "{{ ... }}"' }
    }

    const actionText = template.substring(actionStart, actionEnd).trim()
    const closeLen = template[actionEnd] === '-' ? 3 : 2
    i = actionEnd + closeLen

    if (!actionText) {
      return { valid: false, error: 'Empty template action "{{ }}"' }
    }

    const actionValidation = validateActionContent(actionText, blockStack)
    if (!actionValidation.valid) {
      return actionValidation
    }
  }

  if (blockStack.length > 0) {
    const unclosed = blockStack[blockStack.length - 1]
    return {
      valid: false,
      error: `Unclosed control structure "{{ ${unclosed.action} }}"`,
    }
  }

  return { valid: true }
}

const validateActionContent = (
  actionText: string,
  blockStack: { type: string; action: string }[]
): TemplateValidationError => {
  let inDoubleQuote = false
  let inRawQuote = false
  let inComment = false
  let parenDepth = 0

  const len = actionText.length
  let k = 0

  while (k < len) {
    const char = actionText[k]
    const nextChar = actionText[k + 1]

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false
        k += 2
        continue
      }
      k++
      continue
    }

    if (inDoubleQuote) {
      if (char === '\\') {
        k += 2
        continue
      }
      if (char === '"') {
        inDoubleQuote = false
      }
      k++
      continue
    }

    if (inRawQuote) {
      if (char === '`') {
        inRawQuote = false
      }
      k++
      continue
    }

    if (char === '"') {
      inDoubleQuote = true
      k++
      continue
    }

    if (char === '`') {
      inRawQuote = true
      k++
      continue
    }

    if (char === '/' && nextChar === '*') {
      inComment = true
      k += 2
      continue
    }

    // Inside action outside quotes/comments:
    // Curly braces '{' or '}' are unexpected inside Go template actions
    if (char === '{' || char === '}') {
      return { valid: false, error: `Unexpected "${char}" in command` }
    }

    if (char === '(') {
      parenDepth++
      k++
      continue
    }

    if (char === ')') {
      if (parenDepth === 0) {
        return { valid: false, error: 'Unexpected ")" in command' }
      }
      parenDepth--
      k++
      continue
    }

    // Check for invalid standalone colons (not part of := assignment)
    if (char === ':') {
      const prevChar = actionText[k - 1]
      const isAssignment = prevChar === '=' || nextChar === '='
      if (!isAssignment) {
        return { valid: false, error: 'Unexpected ":" in command' }
      }
    }

    k++
  }

  if (parenDepth > 0) {
    return { valid: false, error: 'Unclosed parenthesized expression in command' }
  }

  // Tokenize action text to inspect block control keywords (if, else, end, with, range, block, define)
  const tokens = tokenizeActionText(actionText)
  if (tokens.length > 0) {
    let commandToken = tokens[0]
    if (tokens.length >= 3 && (tokens[1] === ':=' || tokens[1] === '=')) {
      commandToken = tokens[2]
    }

    const blockTypeKeywords = ['if', 'with', 'range', 'block', 'define']
    if (blockTypeKeywords.includes(commandToken)) {
      blockStack.push({ type: commandToken, action: actionText })
    } else if (commandToken === 'else') {
      if (blockStack.length === 0) {
        return { valid: false, error: 'Unexpected "{{ else }}" without matching block' }
      }
      const currentBlock = blockStack[blockStack.length - 1].type
      if (!['if', 'with', 'range', 'block'].includes(currentBlock)) {
        return { valid: false, error: `Unexpected "{{ else }}" in "{{ ${currentBlock} }}" block` }
      }
    } else if (commandToken === 'end') {
      if (blockStack.length === 0) {
        return { valid: false, error: 'Unexpected "{{ end }}" without matching block' }
      }
      blockStack.pop()
    }
  }

  return { valid: true }
}

const tokenizeActionText = (actionText: string): string[] => {
  const tokens: string[] = []
  let currentToken = ''
  let inDoubleQuote = false
  let inRawQuote = false
  let inComment = false
  let k = 0
  const len = actionText.length

  while (k < len) {
    const char = actionText[k]
    const nextChar = actionText[k + 1]

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false
        k += 2
        continue
      }
      k++
      continue
    }

    if (inDoubleQuote) {
      if (char === '\\') {
        k += 2
        continue
      }
      if (char === '"') {
        inDoubleQuote = false
      }
      k++
      continue
    }

    if (inRawQuote) {
      if (char === '`') {
        inRawQuote = false
      }
      k++
      continue
    }

    if (char === '"') {
      if (currentToken) {
        tokens.push(currentToken)
        currentToken = ''
      }
      inDoubleQuote = true
      k++
      continue
    }

    if (char === '`') {
      if (currentToken) {
        tokens.push(currentToken)
        currentToken = ''
      }
      inRawQuote = true
      k++
      continue
    }

    if (char === '/' && nextChar === '*') {
      if (currentToken) {
        tokens.push(currentToken)
        currentToken = ''
      }
      inComment = true
      k += 2
      continue
    }

    if (/\s/.test(char) || char === '|' || char === '(' || char === ')') {
      if (currentToken) {
        tokens.push(currentToken)
        currentToken = ''
      }
    } else {
      currentToken += char
    }

    k++
  }

  if (currentToken) {
    tokens.push(currentToken)
  }

  return tokens
}

