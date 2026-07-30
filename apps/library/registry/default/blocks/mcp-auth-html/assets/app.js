import { getUser, signOut } from './supabase.js'

// Shared page helpers: status lines, the sign-in guard, the account bar, and
// copy buttons. Anything that talks to Supabase lives in supabase.js; anything
// specific to one screen lives in that screen's own inline script.
//
// These pages assume they are served from the root of an origin, because
// Supabase Auth builds the consent URL by appending `authorization_url_path` to
// your Site URL.

export const SIGN_IN_PATH = '/auth/'

/** Write to a page's status line. Pass `{ error: true }` to style it as a failure. */
export function setStatus(element, message, { error = false } = {}) {
  if (!element) return
  element.textContent = message
  element.classList.toggle('error', error)
}

/** The message to show a user for a thrown error, without leaking internals. */
export function messageFor(error) {
  return error instanceof Error && error.message ? error.message : 'Something went wrong.'
}

/** A same-origin `returnTo` from the query string, or null. */
export function returnToParam() {
  const value = new URLSearchParams(location.search).get('returnTo')
  if (!value) return null

  // Resolving against the current origin and comparing back is what rejects
  // `//evil.example` and absolute URLs elsewhere — this is an open-redirect
  // guard, not a formatting step.
  const target = new URL(value, location.origin)
  if (target.origin !== location.origin) return null
  return `${target.pathname}${target.search}${target.hash}`
}

/**
 * Resolve the signed-in user, or send them to sign in and resolve to null.
 * Callers must stop work when this returns null: a navigation is already in
 * flight.
 */
export async function requireUser() {
  const user = await getUser()
  if (user) return user

  const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)
  location.replace(`${SIGN_IN_PATH}?returnTo=${returnTo}`)
  return null
}

/** Fill in the account bar and wire its sign-out button. */
export function mountAccountBar(user) {
  const bar = document.querySelector('#account-bar')
  const email = document.querySelector('#account-email')
  const button = document.querySelector('#sign-out')

  if (email) email.textContent = user.email ?? user.id
  if (bar) bar.hidden = false

  button?.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'Signing out…'
    await signOut()
    location.assign(SIGN_IN_PATH)
  })
}

/**
 * Wire every `[data-copy]` button to copy the text content of the element whose
 * id it names.
 */
export function mountCopyButtons() {
  for (const button of document.querySelectorAll('[data-copy]')) {
    const source = document.querySelector(`#${button.dataset.copy}`)
    if (!source) continue

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source.textContent.trim())
        button.textContent = 'Copied'
        setTimeout(() => (button.textContent = 'Copy'), 1500)
      } catch {
        // Clipboard access needs a secure context, so this fails on plain http
        // beyond localhost. Select the text for the user instead.
        getSelection()?.selectAllChildren(source)
        button.textContent = 'Press ⌘C'
        setTimeout(() => (button.textContent = 'Copy'), 2500)
      }
    })
  }
}
