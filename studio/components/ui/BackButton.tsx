import { Button, IconArrowLeft } from '@supabase/ui'

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="2xl:absolute 2xl:top-[2px] -ml-2 2xl:-left-24">
      <Button type="text" icon={<IconArrowLeft />} onClick={onClick}>
        Back
      </Button>
    </div>
  )
}

export default BackButton
