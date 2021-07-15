import { Image } from '@supabase/ui'

export default function EmptyPageState({}: {}) {
  return (
    <>
      <div className="flex h-screen">
        <div className="m-auto">
          <Image source="/supabase-logo.svg" alt="Supabase Logo" className="" />
        </div>
      </div>
    </>
  )
}
