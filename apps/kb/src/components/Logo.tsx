// Same wordmark swap apps/docs' HeaderLogo uses (light/dark SVG pair from
// apps/docs/public), plus the "KB" mono label docs uses "DOCS" for.
//
// The SVGs live in public/, which Astro's `base` config doesn't rewrite on
// its own, so the base is prepended by hand — see
// https://docs.astro.build/en/reference/configuration-reference/#base
function Logo() {
  const base = import.meta.env.BASE_URL

  return (
    <a href={base} className="flex shrink-0 items-center gap-1.5 w-fit">
      <img
        className="hidden dark:block"
        src={`${base}/supabase-dark.svg`}
        width={96}
        height={18}
        alt="Supabase logo"
      />
      <img
        className="block dark:hidden"
        src={`${base}/supabase-light.svg`}
        width={96}
        height={18}
        alt="Supabase logo"
      />
      <span className="font-mono text-sm font-medium text-brand-link mb-px">KB</span>
    </a>
  )
}

export { Logo }
