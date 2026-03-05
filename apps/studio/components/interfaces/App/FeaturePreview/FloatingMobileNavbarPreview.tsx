import { useParams } from 'common'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const FloatingMobileNavbarPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        A floating navbar that appears at the bottom of the screen on mobile viewports. It allows
        you to easily access the AI Assistant, Editor Panel, Advisor Panel, Help, and Menu buttons.
      </p>
      <p className="text-foreground-light text-sm mb-4">
        The navbar is always visible and can be dragged to any position on the screen to move it out
        of the way.
      </p>
      {/* <Image
        src={`${BASE_PATH}/img/previews/table-filter-bar-preview.png`}
        width={1296}
        height={900}
        alt="floating-mobile-navbar-preview"
        className="rounded border"
      /> */}
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Show the floating navbar at the bottom of the screen on mobile viewports</li>
          <li>Hide the second row of mobile navigation bar</li>
        </ul>
      </div>
    </div>
  )
}
