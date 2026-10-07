import { SkipToContent } from 'ui-patterns/SkipToContent'

export default function SkipToContentDemo() {
  return (
    <div className="relative w-full overflow-hidden rounded-md border bg-studio">
      <div className="flex items-center border-b px-4 py-3 text-sm text-foreground-muted">
        Demo header / navigation
      </div>
      {/* Preview shows the focused appearance; production hides until Tab */}
      <SkipToContent href="#skip-demo-main" className="relative left-3 top-2 translate-y-0" />
      <main id="skip-demo-main" tabIndex={-1} className="outline-hidden p-6 pt-2">
        <p className="text-sm text-foreground-light">
          Main content landmark. In a real app, Tab once to reveal the skip link, then Enter to jump
          here.
        </p>
      </main>
    </div>
  )
}
