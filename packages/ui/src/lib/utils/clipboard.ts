import { noop } from 'lodash'
import { toast } from 'sonner'

/**
 * Copy text content (string or Promise<string>) into Clipboard. Safari doesn't support write text into clipboard async,
 * so if you need to load text content async before coping, please use Promise<string> for the 1st arg.
 *
 * IF YOU NEED TO CHANGE THIS FUNCTION, PLEASE TEST IT IN SAFARI with a promised string. Expiring URL to a file in a
 * private bucket will do.
 *
 * Copied code from https://wolfgangrittner.dev/how-to-use-clipboard-api-in-firefox/
 */
export const copyToClipboard = async (str: string | Promise<string>, callback = noop) => {
  const focused = window.document.hasFocus()
  if (focused) {
    if (typeof ClipboardItem && navigator.clipboard?.write) {
      // NOTE: Safari locks down the clipboard API to only work when triggered
      // by a direct user interaction. You can't use it async in a promise.
      // But! You can wrap the promise in a ClipboardItem, and give that to
      // the clipboard API.
      // Found this on https://developer.apple.com/forums/thread/691873
      const text = new ClipboardItem({
        'text/plain': Promise.resolve(str).then((text) => new Blob([text], { type: 'text/plain' })),
      })
      return navigator.clipboard.write([text]).then(callback)
    } else {
      // NOTE: Firefox has support for ClipboardItem and navigator.clipboard.write,
      // but those are behind `dom.events.asyncClipboard.clipboardItem` preference.
      // Good news is that other than Safari, Firefox does not care about
      // Clipboard API being used async in a Promise.
      return Promise.resolve(str)
        .then((text) => navigator.clipboard?.writeText(text))
        .then(callback)
    }
  } else {
    toast.error('Unable to copy to clipboard')
  }
}
