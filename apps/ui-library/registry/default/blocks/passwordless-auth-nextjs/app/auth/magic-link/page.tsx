import { MagicLinkForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/magic-link-form'

export default function MagicLinkPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <MagicLinkForm />
      </div>
    </div>
  )
}
