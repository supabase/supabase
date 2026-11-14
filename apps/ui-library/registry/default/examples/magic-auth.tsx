import { MagicLinkForm } from '@/registry/default/blocks/magic-auth-nextjs/components/magic-link-form'

const MagicAuthDemo = () => {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <MagicLinkForm />
      </div>
    </div>
  )
}

export default MagicAuthDemo
