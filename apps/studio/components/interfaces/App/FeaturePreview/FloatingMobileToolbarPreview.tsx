import Image from 'next/image'

import { BASE_PATH } from '@/lib/constants'

export const FloatingMobileToolbarPreview = () => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        A floating toolbar conveniently positioned at the bottom of the screen on mobile viewports
        to quickly access the Command Menu, Help, Advisor Panel, Editor Panel, and AI Assistant
        buttons.
      </p>
      <p className="text-foreground-light text-sm mb-4">
        It can be dragged to any position on the screen to move it if it gets in the way of
        important content so you can keep working on your project.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/floating-toolbar-preview.png`}
        width={1296}
        height={900}
        quality={100}
        alt="floating-mobile-toolbar-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Show the floating toolbar at the bottom of the screen on mobile viewports</li>
          <li>Hide the second row of mobile navigation bar</li>
        </ul>
      </div>
    </div>
  )
}
