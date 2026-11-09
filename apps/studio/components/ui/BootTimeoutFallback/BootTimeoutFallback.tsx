import {
  BOOT_FALLBACK_MESSAGE,
  BOOT_FALLBACK_REVEAL_DELAY_SECONDS,
  BOOT_FALLBACK_SUPPORT_EMAIL,
} from '@/lib/boot-fallback-copy'
import { IS_PLATFORM } from '@/lib/constants'

const FALLBACK_ID = 'studio-boot-fallback'

// Next.js equivalent of the TanStack build's ShellFallback (see
// components/interfaces/App/ShellFallback.tsx): a safety net for a stuck
// chunk load (FE-4460). Next always server-renders real page content into
// <Main />, so — unlike TanStack's ClientOnly fallback, which shows nothing
// until hydration — this can't be a full-screen overlay shown by default; it
// has to reveal itself only once it's clear the page is actually stuck.
//
// The reveal is pure CSS (a delayed animation), not a JS timer, so it still
// fires even if every JS chunk fails to load. Hiding it on a successful
// mount necessarily needs JS — see `clearBootTimeoutFallback` — but a
// missed hide is harmless: the reveal only starts after
// BOOT_FALLBACK_REVEAL_DELAY_SECONDS, by which point a successful mount has
// long since hidden it.
export function BootTimeoutFallback() {
  return (
    <>
      <style>{`
        #${FALLBACK_ID} {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #1c1c1c;
          pointer-events: none;
          visibility: hidden;
          opacity: 0;
          animation: studio-boot-fallback-reveal 0.3s ease-out ${BOOT_FALLBACK_REVEAL_DELAY_SECONDS}s forwards;
        }
        #${FALLBACK_ID} p {
          color: #fff;
          font-family: sans-serif;
          font-size: 14px;
          text-align: center;
        }
        @keyframes studio-boot-fallback-reveal {
          to {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>
      <div id={FALLBACK_ID}>
        <p>
          {BOOT_FALLBACK_MESSAGE}
          {IS_PLATFORM && (
            <>
              {' '}
              If the problem persists, contact{' '}
              <a href={`mailto:${BOOT_FALLBACK_SUPPORT_EMAIL}`}>{BOOT_FALLBACK_SUPPORT_EMAIL}</a>.
            </>
          )}
        </p>
      </div>
    </>
  )
}

/** Call once the app has actually mounted, to hide the fallback above. */
export function clearBootTimeoutFallback() {
  const el = document.getElementById(FALLBACK_ID)
  if (el) el.style.display = 'none'
}
