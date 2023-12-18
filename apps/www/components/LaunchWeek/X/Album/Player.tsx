import Link from 'next/link'
import { useAudio } from 'react-use'
import { IconArrowRight, cn } from 'ui'

const Player = () => {
  const [audio, state, controls, ref] = useAudio({
    src: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/audio/supabase-album/Bernard.m4a',
    loop: true,
  })

  const isPlaying = state.playing
  const trackName = audio.props.src?.split('/')?.slice(-1)?.toString()?.split('.')[0]
  const duration = ref?.current?.duration ?? 0
  const progress = (state.time * 100) / duration
  const playerLength = 47
  const playerProgress = -(progress * playerLength) / 100 - playerLength

  return (
    <div className="flex items-center gap-2">
      {audio}
      <Link
        href="https://supabase.productions/"
        target="_blank"
        className={cn(
          'opacity-0 outline-none group translate-x-2 !ease-[.24,0,.22,.99] duration-200 transition-all text-foreground-muted hover:text-foreground !leading-3 font-mono uppercase text-[10px] flex flex-col text-right',
          isPlaying && 'opacity-100 translate-x-0'
        )}
      >
        <span className="text-border-strong">Now playing</span>
        <span className="tracking-widest flex justify-end gap-px text-right translate-x-0 transition-transform group-hover:-translate-x-2">
          {trackName}
          <IconArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -mr-full absolute -right-3 text-current transition-opacity" />
        </span>
      </Link>
      <button
        onClick={isPlaying ? controls.pause : controls.play}
        className="relative outline-border-muted w-7 h-7 opacity-70 hover:opacity-100 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground-lighter transition-opacity"
        style={{
          background: `radial-gradient(closest-side, #060809 79%, transparent 95% 100%),conic-gradient(hsl(var(--foreground-lighter)) ${progress.toFixed()}%, hsl(var(--border-muted)) 0)`,
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle opacity="0.1" cx="8" cy="8" r="7.5" stroke="hsl(var(--foreground-default))" />
          <circle
            cx="8"
            cy="8"
            r="7.5"
            stroke="white"
            opacity="0.4"
            strokeLinecap="round"
            className={cn('transition-opacity', isPlaying ? 'opacity-30' : 'opacity-10')}
            strokeDasharray={playerLength}
            strokeDashoffset={playerProgress}
          />
        </svg>

        {isPlaying ? (
          <svg
            className="w-2.5 h-2.5"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1" width="4" height="12" fill="currentColor" />
            <rect x="7" width="4" height="12" fill="currentColor" />
          </svg>
        ) : (
          <svg
            className="w-2.5 h-2.5 transform translate-x-px"
            width="11"
            height="12"
            viewBox="0 0 11 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.0075 6L0.20752 0V12" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default Player
