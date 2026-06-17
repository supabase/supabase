import {
  DEFAULT_GITHUB_TEMPLATE_REF,
  DEFAULT_GITHUB_TEMPLATE_REPOSITORY,
  type RegistryCommandOptions,
} from 'template-composer'

export const START_TEMPLATE_REPOSITORY_ENV = 'START_TEMPLATE_REPOSITORY'
export const START_TEMPLATE_REF_ENV = 'START_TEMPLATE_REF'
export const NEXT_PUBLIC_START_TEMPLATE_REPOSITORY_ENV = 'NEXT_PUBLIC_START_TEMPLATE_REPOSITORY'
export const NEXT_PUBLIC_START_TEMPLATE_REF_ENV = 'NEXT_PUBLIC_START_TEMPLATE_REF'

interface StartTemplateRegistryEnv {
  START_TEMPLATE_REPOSITORY?: string
  START_TEMPLATE_REF?: string
  NEXT_PUBLIC_START_TEMPLATE_REPOSITORY?: string
  NEXT_PUBLIC_START_TEMPLATE_REF?: string
}

export function getStartTemplateRepository(env = readServerTemplateRegistryEnv()): string {
  return (
    env[START_TEMPLATE_REPOSITORY_ENV] ??
    env[NEXT_PUBLIC_START_TEMPLATE_REPOSITORY_ENV] ??
    DEFAULT_GITHUB_TEMPLATE_REPOSITORY
  )
}

export function getStartTemplateRef(env = readServerTemplateRegistryEnv()): string {
  return (
    env[START_TEMPLATE_REF_ENV] ??
    env[NEXT_PUBLIC_START_TEMPLATE_REF_ENV] ??
    DEFAULT_GITHUB_TEMPLATE_REF
  )
}

export function getStartTemplateRegistryCommandOptions(
  env = readPublicTemplateRegistryEnv()
): RegistryCommandOptions {
  return {
    registrySlug:
      env[NEXT_PUBLIC_START_TEMPLATE_REPOSITORY_ENV] ??
      env[START_TEMPLATE_REPOSITORY_ENV] ??
      DEFAULT_GITHUB_TEMPLATE_REPOSITORY,
  }
}

function readServerTemplateRegistryEnv(): StartTemplateRegistryEnv {
  return {
    START_TEMPLATE_REPOSITORY: process.env.START_TEMPLATE_REPOSITORY,
    START_TEMPLATE_REF: process.env.START_TEMPLATE_REF,
    NEXT_PUBLIC_START_TEMPLATE_REPOSITORY: process.env.NEXT_PUBLIC_START_TEMPLATE_REPOSITORY,
    NEXT_PUBLIC_START_TEMPLATE_REF: process.env.NEXT_PUBLIC_START_TEMPLATE_REF,
  }
}

function readPublicTemplateRegistryEnv(): StartTemplateRegistryEnv {
  return {
    NEXT_PUBLIC_START_TEMPLATE_REPOSITORY: process.env.NEXT_PUBLIC_START_TEMPLATE_REPOSITORY,
    NEXT_PUBLIC_START_TEMPLATE_REF: process.env.NEXT_PUBLIC_START_TEMPLATE_REF,
  }
}
