import { getProjectSettingsByRef } from './projects'
import { assertSelfHosted } from './util'

/**
 * Gets self-hosted project settings for the given project ref.
 * Defaults to `'default'` for full backward compatibility with the
 * single-project configuration.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProjectSettings(ref: string | string[] | undefined = 'default') {
  assertSelfHosted()
  return getProjectSettingsByRef(ref)
}
