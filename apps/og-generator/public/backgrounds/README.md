# Thumb fallback backgrounds

Drop image files here (SVG/PNG/JPEG/WebP) to be used as the Thumb's
background when no icon is selected — see `lib/design/backgrounds.ts`
(`randomBackgroundDataUri()`). No code change needed to add one; it's picked
up automatically. OG/layout renders no longer use this folder — only the
Thumb does.
