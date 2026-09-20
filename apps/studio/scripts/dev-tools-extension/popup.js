// Copy the Supabase dashboard session from a hosted-dashboard tab into a local
// Studio tab (localStorage) and reload it. See ./README.md.

const STORAGE_KEYS = ['supabase.dashboard.auth.token', 'supabase.dashboard.auth.token-user']
const SOURCE_HOST_PATTERN = /^https:\/\/(supabase\.com|supabase\.green)$/
const DEFAULT_TARGET_ORIGIN = 'http://localhost:8082'

const els = {
  sourceTab: document.getElementById('source-tab'),
  targetTab: document.getElementById('target-tab'),
  targetOrigin: document.getElementById('target-origin'),
  sync: document.getElementById('sync'),
  status: document.getElementById('status'),
  connDot: document.getElementById('conn-dot'),
}

let sourceTabId = null
let targetTabId = null

function setStatus(message, kind) {
  els.status.textContent = message
  els.status.className = kind ?? ''
}

function originOf(url) {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

// Runs in the source page: read the session keys from localStorage.
function readKeys(keys) {
  const out = {}
  for (const key of keys) {
    const value = window.localStorage.getItem(key)
    if (value !== null) out[key] = value
  }
  return out
}

// Runs in the target page: write the session keys and reload.
function writeKeysAndReload(entries) {
  for (const [key, value] of Object.entries(entries)) {
    window.localStorage.setItem(key, value)
  }
  window.location.reload()
}

async function findTabs() {
  const targetOrigin = originOf(els.targetOrigin.value) ?? DEFAULT_TARGET_ORIGIN
  const tabs = await chrome.tabs.query({})

  const source = tabs.find((tab) => SOURCE_HOST_PATTERN.test(originOf(tab.url) ?? ''))
  const target = tabs.find((tab) => (originOf(tab.url) ?? '') === targetOrigin)

  sourceTabId = source?.id ?? null
  targetTabId = target?.id ?? null

  els.sourceTab.textContent = source ? originOf(source.url) : 'no tab open'
  els.targetTab.textContent = target ? targetOrigin : `open ${targetOrigin}`
  els.sync.disabled = !(sourceTabId && targetTabId)

  await refreshConnected()
}

// Green dot when the local Studio tab already holds a dashboard session.
async function refreshConnected() {
  let connected = false
  if (targetTabId) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        func: (key) => Boolean(window.localStorage.getItem(key)),
        args: [STORAGE_KEYS[0]],
      })
      connected = Boolean(result)
    } catch {
      connected = false
    }
  }
  els.connDot.className = `dot ${connected ? 'on' : 'off'}`
}

async function sync() {
  els.sync.disabled = true
  setStatus('Reading session…')
  try {
    const [{ result: entries }] = await chrome.scripting.executeScript({
      target: { tabId: sourceTabId },
      func: readKeys,
      args: [STORAGE_KEYS],
    })

    if (!entries || !entries[STORAGE_KEYS[0]]) {
      setStatus(
        'No dashboard session found in the source tab. Make sure you are signed in on the hosted dashboard.',
        'err'
      )
      els.sync.disabled = false
      return
    }

    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: writeKeysAndReload,
      args: [entries],
    })

    setStatus(`Synced ${Object.keys(entries).length} key(s) and reloaded local Studio.`, 'ok')
    els.connDot.className = 'dot on'
  } catch (error) {
    setStatus(`Sync failed: ${error?.message ?? error}`, 'err')
    els.sync.disabled = false
  }
}

async function init() {
  const stored = await chrome.storage.local.get('targetOrigin')
  els.targetOrigin.value = stored.targetOrigin ?? DEFAULT_TARGET_ORIGIN
  await findTabs()

  els.targetOrigin.addEventListener('change', async () => {
    await chrome.storage.local.set({ targetOrigin: els.targetOrigin.value })
    await findTabs()
  })
  els.sync.addEventListener('click', sync)
}

init()
