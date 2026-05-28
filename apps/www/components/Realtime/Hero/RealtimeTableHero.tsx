'use client'

import { memo, useState } from 'react'

import { RealtimeCursorLayer } from './RealtimeCursorLayer'
import { RealtimeTableChrome, RealtimeTableFrame } from './RealtimeTableChrome'
import { RealtimeTableGrid } from './RealtimeTableGrid'
import { useAugmentedUsers } from './useAugmentedUsers'
import { useDemoTable } from './useDemoTable'

const HERO_GRID_TRANSFORM = {
  transform: 'rotateX(10deg) scale(0.9)',
  transformOrigin: '50% 0%',
  transformStyle: 'preserve-3d' as const,
}

function RealtimeTableHeroInner() {
  const [presenceCount, setPresenceCount] = useState(0)

  const {
    rows,
    focusedCells,
    containerRef,
    cursorStore,
    setUserCursor,
    setUserCellFocus,
    disconnectUser,
  } = useDemoTable()

  useAugmentedUsers({
    containerRef,
    onCursorMove: setUserCursor,
    onCellFocus: setUserCellFocus,
    onUserDisconnect: disconnectUser,
    onActiveUsersChange: setPresenceCount,
  })

  return (
    <div className="container relative mx-auto px-6 pt-8 pb-0 sm:px-16 lg:pt-12 xl:px-20">
      <div className="relative [perspective:1200px]">
        <div style={HERO_GRID_TRANSFORM}>
          <RealtimeTableFrame>
            <div ref={containerRef} className="relative">
              <RealtimeTableChrome presenceCount={presenceCount} />
              <div className="relative overflow-hidden">
                <RealtimeTableGrid rows={rows} focusedCells={focusedCells} />
              </div>
              <RealtimeCursorLayer store={cursorStore} />
            </div>
          </RealtimeTableFrame>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-40 bg-gradient-to-t from-background to-transparent"
        />
      </div>
    </div>
  )
}

export default memo(RealtimeTableHeroInner)
