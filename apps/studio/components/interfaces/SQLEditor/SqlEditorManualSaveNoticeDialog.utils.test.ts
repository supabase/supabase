import { describe, expect, it } from 'vitest'

import {
  shouldShowManualSaveNotice,
  type ShouldShowManualSaveNoticeParams,
} from './SqlEditorManualSaveNoticeDialog.utils'

const eligible: ShouldShowManualSaveNoticeParams = {
  isPlatform: true,
  isFeaturePreviewInitialized: true,
  isForced: true,
  hasOptedIntoPreview: false,
  isNoticeDismissed: false,
}

describe('shouldShowManualSaveNotice', () => {
  it('shows the notice to a user the rollout switches over', () => {
    expect(shouldShowManualSaveNotice(eligible)).toBe(true)
  })

  it('does not show the notice to a user who opted into the preview themselves', () => {
    expect(shouldShowManualSaveNotice({ ...eligible, hasOptedIntoPreview: true })).toBe(false)
  })

  it('does not show the notice once dismissed', () => {
    expect(shouldShowManualSaveNotice({ ...eligible, isNoticeDismissed: true })).toBe(false)
  })

  it('does not show the notice when the rollout flag is off', () => {
    expect(shouldShowManualSaveNotice({ ...eligible, isForced: false })).toBe(false)
  })

  it('does not show the notice outside of the hosted platform', () => {
    expect(shouldShowManualSaveNotice({ ...eligible, isPlatform: false })).toBe(false)
  })

  it('does not show the notice before the feature previews have initialized', () => {
    expect(shouldShowManualSaveNotice({ ...eligible, isFeaturePreviewInitialized: false })).toBe(
      false
    )
  })
})
