import { useRef, useEffect } from 'react'
import { renderToString } from 'react-dom/server'

import { makeRandomString } from 'lib/helpers'
import KeyMap from './KeyMap'

/**
 * Hook for listening to hover action on the target element and show tooltip.
 * A tooltip contains a title and an optional keyMap shortcut.
 *
 * @param   {String}        title
 * @param   {String}        position          top/top-left/bottom/bottom-left/left/right. default value: bottom
 * @param   {String}        keyMap            element key shortcuts
 * @param   {String}        className         custom class name
 * @param   {Boolean}       nowrap            disable title wrap text
 *
 * @returns {Object}        Ref for the target element
 */

export default function TooltipListener({
  title = '',
  position = 'bottom',
  keyMap = null,
  className = '',
  nowrap = false,
}) {
  const ref = useRef<any>(null)
  const tooltipId = `tooltip-${makeRandomString(5)}`
  const tooltip = document.createElement('div')
  tooltip.id = tooltipId
  tooltip.className = `tooltips ${position} absolute p-2 m-1 bg-black border border-solid border-default rounded-lg rounded text-center ${className} z-50`
  tooltip.innerHTML = `<span class="title ${
    nowrap ? 'nowrap' : ''
  }">${title}</span> ${renderToString(
    <div className="dark">
      {/* force dark mode on KeyMap */}
      <KeyMap keyMap={keyMap} />
    </div>
  )}`

  function handleMouseOver() {
    const elem = document.getElementById(tooltipId)
    if (!elem) {
      ref.current.style.position = 'relative'
      ref.current.appendChild(tooltip)
    }
  }

  function handleMouseLeave() {
    removeTooltip()
  }

  function handleMouseClick() {
    removeTooltip()
  }

  function removeTooltip() {
    const elem = document.getElementById(tooltipId)
    if (elem) {
      ref.current.style.position = 'static'
      ref.current.removeChild(elem)
    }
  }

  useEffect(() => {
    if (!ref.current) return

    ref.current.addEventListener('mouseover', handleMouseOver)
    ref.current.addEventListener('mouseleave', handleMouseLeave)
    ref.current.addEventListener('click', handleMouseClick)

    return () => {
      ref.current.removeEventListener('mouseover', handleMouseOver)
      ref.current.removeEventListener('mouseleave', handleMouseLeave)
      ref.current.removeEventListener('click', handleMouseClick)
    }
  }, [ref.current])

  return ref
}
