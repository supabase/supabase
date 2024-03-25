/**
 * Render keyMap
 *
 * @param {String} keyMap       ex: Command+Enter ; separate key using +
 */

const customKeyChars: any = {
  command: '⌘',
  control: '⌃',
  option: '⌥',
  enter: '↵',
}

const KeyMap = ({ keyMap }: any) => {
  if (!keyMap) return null

  const keys = keyMap.split('+')
  const keymapRender = keys.map((key: any) => {
    let keyChar = key
    if (key.toLowerCase() in customKeyChars) keyChar = customKeyChars[key.toLowerCase()]
    return (
      <span key={key} className={`btn-keymap ${keyChar.length > 1 ? 'px-2' : ''}`}>
        {keyChar}
      </span>
    )
  })
  return <p className="inline-flex space-x-1.5">{keymapRender}</p>
}

export default KeyMap
