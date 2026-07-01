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

**Simplest: one text file of Figma links.** No exporting, no pairing —
just a plain list, one URL per line:

```
reference-examples/
  figma-links.txt
```

```
https://www.figma.com/design/abc123/...?node-id=1-2
https://www.figma.com/design/abc123/...?node-id=3-4
https://www.figma.com/file/xyz789/...
```

Claude Code pulls the screenshot + design context for each link directly via
the Figma integration — no manual export needed.

**Alternative: paired image + note files**, if you'd rather export PNGs
yourself (§12):

```
reference-examples/
  example-01.png        # the rendered OG/thumb
  example-01.figma.txt  # the Figma URL (or export notes) for example-01
  example-02.png
  example-02.figma.txt
  ...
```

Either works, and they can be mixed. These files are **internal-only**
(§11.6) and git-ignored — they inform the build; they're never shipped or
exported.

## Also used for: image-generation training reference

If we pursue a fine-tuned illustration generator (LoRA), this same drop zone
is the intake for that training set too — the on-brand illustrations gathered
here (via either format above) double as the reference set, so there's only
one place to hand off images.

## Then

Ask Claude Code to "analyze the reference-examples and update the featured
examples + templates." It will read the images (and any Figma links), extract
the patterns, and write structured entries into `lib/ai/examples.ts` (and tune
`lib/design/{templates,tokens}.ts` where the data supports it).
