// Same sun/moon icon apps/docs' mobile menu ThemeToggle uses (ui-patterns/ThemeToggle),
// but a plain binary light/dark switch — no system option, no dropdown, no next-themes.
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
  const next = isDark ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem('theme', next)
  } catch {
    // localStorage unavailable (e.g. private browsing) — theme just won't persist.
  }
}

// Theme is read/written as the `data-theme` attribute on <html> (matching
// next-themes' default `attribute="data-theme"`, which is what the shared
// theme CSS and Tailwind's `dark:` variant key off — see
// packages/config/css/variants.css). The no-flash script in Layout.astro sets
// the initial attribute before paint; this just flips it on click. The icons
// themselves don't need React state — which one is visible is driven purely
// by the `dark:` CSS variant, so there's no hydration-mismatch risk to guard
// against here.
function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-md text-foreground-light hover:text-foreground"
    >
      <svg
        className="hidden dark:block h-5 w-5 rotate-0 transition-transform"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
      </svg>
      <svg
        className="block dark:hidden h-5 w-5 rotate-0 transition-transform"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

export { ThemeToggle }
