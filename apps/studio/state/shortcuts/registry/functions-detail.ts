import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to a single edge function's detail layout — active anywhere
 * under `/project/<ref>/functions/<slug>/*`.
 *
 * The test sheet submit is registered here too, since it conceptually belongs
 * with the test-related actions even though it's only listened to while the
 * sheet is open.
 */
export const FUNCTIONS_DETAIL_SHORTCUT_IDS = {
  FUNCTION_DETAIL_OPEN_TEST: 'functions-detail.open-test',
  FUNCTION_DETAIL_OPEN_DOWNLOAD: 'functions-detail.open-download',
  FUNCTION_DETAIL_COPY_URL: 'functions-detail.copy-url',
  FUNCTION_DETAIL_SUBMIT_TEST: 'functions-detail.submit-test',
}

export type FunctionsDetailShortcutId =
  (typeof FUNCTIONS_DETAIL_SHORTCUT_IDS)[keyof typeof FUNCTIONS_DETAIL_SHORTCUT_IDS]

export const functionsDetailRegistry: RegistryDefinations<FunctionsDetailShortcutId> = {
  [FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST]: {
    id: FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST,
    label: 'Open test sheet',
    sequence: ['Shift+T'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_DOWNLOAD]: {
    id: FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_DOWNLOAD,
    label: 'Open download menu',
    sequence: ['Shift+D'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL]: {
    id: FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL,
    label: 'Copy function URL',
    sequence: ['Shift+C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_SUBMIT_TEST]: {
    id: FUNCTIONS_DETAIL_SHORTCUT_IDS.FUNCTION_DETAIL_SUBMIT_TEST,
    label: 'Send test request',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
}
