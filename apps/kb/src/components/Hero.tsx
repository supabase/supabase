// Ported from apps/docs/components/HomePageCover.tsx — just the title + intro
// copy (rebranded for kb), without the animated logo or the CLI/AI setup
// prompt panel (docs-specific, feature-flagged, and not something kb has yet).
function Hero() {
  return (
    <div className="w-full border-b bg-muted/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="m-0 text-3xl text-foreground sm:text-4xl">Supabase Knowledge Base</h1>
        <p className="m-0 mt-2 text-base leading-7 text-foreground-light sm:mt-3 sm:text-xl">
          In-depth guides, tutorials, and explainers for best practices for Supabase databases.
        </p>
      </div>
    </div>
  )
}

export { Hero }
