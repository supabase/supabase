import { describe, expect, it } from 'vitest'

import { getGuideOutline } from './GuidesMdx.outline'

const STEPPER = `## Quickstart

<StepHikeCompact>
  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Create a project">Launch a project.</StepHikeCompact.Details>
  </StepHikeCompact.Step>
  <StepHikeCompact.Step step={2}>
    <StepHikeCompact.Details title="Install">Install the client.</StepHikeCompact.Details>
  </StepHikeCompact.Step>
</StepHikeCompact>
`

describe('getGuideOutline', () => {
  it('draws one step for each step of a stepper', () => {
    expect(getGuideOutline(STEPPER)).toEqual(['heading', 'step', 'step'])
  })

  it('ends at a block whose size the build cannot know', () => {
    expect(
      getGuideOutline('Intro.\n\n<$Partial path="setup.mdx" />\n\n## After the partial')
    ).toEqual(['text-1'])
  })

  // the template already draws the title, and imports render nothing
  it('skips the page title and imports', () => {
    expect(getGuideOutline("import Video from './video'\n\n# Title\n\n## Section")).toEqual([
      'heading',
    ])
  })

  // the outline runs while the docs build, so a broken page must not fail it
  it('gives no outline for content that does not parse', () => {
    expect(getGuideOutline('<Tabs>\n\nunclosed')).toEqual([])
  })
})
