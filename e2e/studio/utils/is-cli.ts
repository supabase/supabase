import { env } from '../env.config'

/**
 * Returns true if running in CLI/self-hosted mode (locally),
 * false if running in hosted mode.
 */
export function isCLI(): boolean {
  // IS_PLATFORM=true = hosted mode
  // IS_PLATFORM=false = CLI/self-hosted mode
  return env.IS_PLATFORM === 'false'
}
