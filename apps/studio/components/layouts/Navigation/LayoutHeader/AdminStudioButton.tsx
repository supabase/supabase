import { useFlag, useParams } from 'common'
import { Wrench } from 'lucide-react'
import Link from 'next/link'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ADMIN_STUDIO_URL, IS_PLATFORM } from '@/lib/constants'

export const AdminStudioButton = () => {
  const params = useParams()
  const adminStudioLinkEnabled = useFlag('adminStudioLink')

  const isVisible = IS_PLATFORM ? adminStudioLinkEnabled : false

  if (!isVisible || !ADMIN_STUDIO_URL || !params.ref) return null

  return (
    <ButtonTooltip
      asChild
      variant="default"
      className="rounded-full w-[26px] h-[26px]"
      icon={<Wrench size={16} strokeWidth={1.5} />}
      tooltip={{
        content: {
          text: 'Open in Admin Studio',
          side: 'bottom',
          align: 'center',
        },
      }}
    >
      <Link
        href={`${ADMIN_STUDIO_URL}?identifier=${params.ref}`}
        target="_blank"
        rel="noreferrer noopener"
      />
    </ButtonTooltip>
  )
}
