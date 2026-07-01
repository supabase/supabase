# Reference examples (build-time inspiration)

Drop genuinely strong, on-brand OG/Thumb examples here so their **design system**
can be extracted and encoded into the app. This is the brief's §6.8A / §12 flow.

## Important: how examples actually inform the AI

The runtime suggester reasons over **structured records** (`lib/ai/examples.ts` →
`FeaturedExample`: subject → icon + template + pattern + _why it works_), **not
raw pixels**. So an image or Figma file doesn't feed the AI directly — it's
**reference** that a human (or Claude Code) reads to:

1. tune the **templates / design tokens** (spacing ratios, icon placement,
   stroke & shadow by "mood", headline rhythm), and
2. author **structured `featured_examples`** that map a subject to a proven recipe.

Those structured records are what the AI uses.

## What to drop here

Pair each rendered image with its source, matching filenames (§12):

```
reference-examples/
  example-01.png        # the rendered OG/thumb
  example-01.figma.txt  # the Figma URL (or export notes) for example-01
  example-02.png
  example-02.figma.txt
  ...
```

- **Static images** — export the good OG/thumb PNGs and drop them in.
- **Figma artboards** — put the Figma **link** in the matching `*.figma.txt`
  (Claude Code can pull design context/variables/screenshots via the Figma
  integration). Or drop a PNG export of the artboard.

These files are **internal-only** (§11.6) and git-ignored — they inform the
build; they're never shipped or exported.

## Then

Ask Claude Code to "analyze the reference-examples and update the featured
examples + templates." It will read the images (and any Figma links), extract
the patterns, and write structured entries into `lib/ai/examples.ts` (and tune
`lib/design/{templates,tokens}.ts` where the data supports it).
