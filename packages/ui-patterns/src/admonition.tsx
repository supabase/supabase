// Must point at ./Admonition/index explicitly: on case-insensitive filesystems
// (macOS) a bare './Admonition' resolves to './Admonition.tsx', which is this
// same file, making the re-export a no-op that exports nothing.
export * from './Admonition/index'
