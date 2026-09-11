import { InstallationPanel } from './installation-panel'
import { Mdx } from './mdx-components'
import type { Doc } from '@/.velite'
import { getInstallationCommands } from '@/lib/install-command'

export function BlockInstallation({ doc, pagePath }: { doc: Doc; pagePath: string }) {
  if (!doc.installation.length && !doc.installationContent) return null

  const commands = getInstallationCommands(doc.installation)

  return (
    <section id="installation" className="mx-auto -mt-px mb-16 max-w-2xl scroll-m-24">
      <div className="space-y-6">
        {doc.installation.length > 0 && (
          <InstallationPanel title={doc.title} pagePath={pagePath} commands={commands} />
        )}
        {doc.installationContent && <Mdx code={doc.installationContent} />}
      </div>
    </section>
  )
}
