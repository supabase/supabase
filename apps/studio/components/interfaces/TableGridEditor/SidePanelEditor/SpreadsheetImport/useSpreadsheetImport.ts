import { debounce, noop } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { SpreadsheetData } from './SpreadsheetImport.types'
import { parseSpreadsheet, parseSpreadsheetText } from './SpreadsheetImport.utils'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

interface NoFileState {
  _tag: 'no_selected_file'
}

interface NoInputState {
  _tag: 'no_pasted_text'
}

interface ParsingFileState {
  _tag: 'parsing_file'
  file: File
  progress: number
}

interface ParsingTextState {
  _tag: 'parsing_text'
  text: string
  progress: number
}

interface FileParsedState {
  _tag: 'file_parsed'
  file: File
  selectedHeaders: Array<string>
  emptyStringAsNullHeaders: Array<string>
  data: SpreadsheetData
  errors: Array<Papa.ParseError & { data: unknown }>
}

interface TextParsedState {
  _tag: 'text_parsed'
  text: string
  selectedHeaders: Array<string>
  emptyStringAsNullHeaders: Array<string>
  data: SpreadsheetData
  errors: Array<Papa.ParseError & { data: unknown }>
}

type FileUploadState =
  | NoFileState
  | ParsingFileState
  | FileParsedState
  | NoInputState
  | ParsingTextState
  | TextParsedState

export function isFileTab(
  state: FileUploadState
): state is NoFileState | ParsingFileState | FileParsedState {
  return (
    state._tag === 'no_selected_file' ||
    state._tag === 'parsing_file' ||
    state._tag === 'file_parsed'
  )
}

export function hasAttachedFile(
  state: FileUploadState
): state is ParsingFileState | FileParsedState {
  return state._tag === 'parsing_file' || state._tag === 'file_parsed'
}

export function hasAttachedText(
  state: FileUploadState
): state is ParsingTextState | TextParsedState {
  return state._tag === 'parsing_text' || state._tag === 'text_parsed'
}

export function isEmptyState(state: FileUploadState): state is NoFileState | NoInputState {
  return state._tag === 'no_selected_file' || state._tag === 'no_pasted_text'
}

export function isParsingState(
  state: FileUploadState
): state is ParsingFileState | ParsingTextState {
  return state._tag === 'parsing_file' || state._tag === 'parsing_text'
}

export function isParsedState(state: FileUploadState): state is FileParsedState | TextParsedState {
  return state._tag === 'file_parsed' || state._tag === 'text_parsed'
}

const csvParseErrorMessage =
  'Some issues have been detected. More details below the content preview.'

interface UseSpreadsheetImportParameters {
  markDirty?: (dirty: boolean) => void
  debounceDuration?: number
}

export function useSpreadsheetImport({
  markDirty = noop,
  debounceDuration = 250,
}: UseSpreadsheetImportParameters) {
  const abortControllerRef = useRef<AbortController>(new AbortController())
  const resetAbortController = useCallback(function resetAbortController() {
    abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()
    return abortControllerRef.current.signal
  }, [])

  const tableEditorSnap = useTableEditorStateSnapshot()
  const fileFromGlobalState =
    tableEditorSnap.sidePanel?.type === 'csv-import' ? tableEditorSnap.sidePanel.file : undefined

  const [historicalState, setHistoricalState] = useState<FileUploadState>()
  const [state, setState] = useState<FileUploadState>(function initializeState() {
    if (fileFromGlobalState) {
      return {
        _tag: 'parsing_file',
        file: fileFromGlobalState,
        progress: 0,
      }
    } else {
      return { _tag: 'no_selected_file' }
    }
  })

  const handleSwitchTab = useCallback(
    function switchTab() {
      if (isFileTab(state)) {
        setState(historicalState ?? { _tag: 'no_pasted_text' })
      } else {
        setState(historicalState ?? { _tag: 'no_selected_file' })
      }
      setHistoricalState(state)
    },
    [state, historicalState]
  )

  const setParseProgress = useCallback(function setParseProgress(progress: number) {
    setState((prev) => {
      if (prev._tag === 'parsing_file' || prev._tag === 'parsing_text') {
        return { ...prev, progress }
      }
      return prev
    })
  }, [])

  const processFile = useCallback(
    async function processFile(
      file: File,
      { emptyStringAsNullHeaders }: { emptyStringAsNullHeaders?: Array<string> }
    ) {
      const currentSignal = resetAbortController()

      const {
        headers,
        emptyStringAsNullHeaders: resolvedEmptyStringAsNullHeaders,
        rowCount,
        columnTypeMap,
        errors,
        previewRows,
      } = await parseSpreadsheet(file, setParseProgress, emptyStringAsNullHeaders)
      if (currentSignal.aborted) return

      if (errors.length > 0) {
        toast.error(csvParseErrorMessage)
      }

      setState({
        _tag: 'file_parsed',
        file,
        selectedHeaders: headers,
        emptyStringAsNullHeaders: resolvedEmptyStringAsNullHeaders,
        data: { headers, rows: previewRows, rowCount, columnTypeMap },
        errors,
      })
    },
    [resetAbortController, setParseProgress]
  )

  const processText = useCallback(
    async function processText(
      text: string,
      { emptyStringAsNullHeaders }: { emptyStringAsNullHeaders: Array<string> | undefined }
    ) {
      const currentSignal = resetAbortController()
      const {
        headers,
        emptyStringAsNullHeaders: resolvedEmptyStringAsNullHeaders,
        rows,
        columnTypeMap,
        errors,
      } = await parseSpreadsheetText({
        text,
        emptyStringAsNullHeaders,
      })
      if (currentSignal.aborted) return

      if (errors.length > 0) {
        toast.error(csvParseErrorMessage)
      }

      setState({
        _tag: 'text_parsed',
        text,
        selectedHeaders: headers,
        emptyStringAsNullHeaders: resolvedEmptyStringAsNullHeaders,
        data: { headers, rows, rowCount: rows.length, columnTypeMap },
        errors,
      })
    },
    [resetAbortController]
  )
  const processTextStable = useStaticEffectEvent(processText)
  const processTextDebounced = useMemo(
    () => debounce(processTextStable, debounceDuration),
    [debounceDuration, processTextStable]
  )

  const cleanup = useStaticEffectEvent(function cleanup() {
    processTextDebounced.cancel()
    abortControllerRef.current.abort()
  })
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // When the component mounts with a file already in global state (e.g. dropped onto the
  // grid), the useState initializer above sets _tag to 'parsing_file' but does not start
  // the actual parse. Kick it off here. useStaticEffectEvent ensures we always read the
  // latest state/treatEmptyAsNull without re-triggering the effect.
  const processOnMount = useStaticEffectEvent(async function processOnMount() {
    if (state._tag === 'parsing_file') {
      await processFile(state.file, { emptyStringAsNullHeaders: undefined })
    }
  })
  useEffect(() => {
    processOnMount()
  }, [processOnMount])

  const processSpreadsheet = useCallback(
    async function processSpreadsheet({
      emptyStringAsNullHeaders,
    }: {
      emptyStringAsNullHeaders: Array<string> | undefined
    }) {
      if (hasAttachedFile(state)) {
        return processFile(state.file, { emptyStringAsNullHeaders })
      } else if (hasAttachedText(state)) {
        return processText(state.text, { emptyStringAsNullHeaders })
      }
    },
    [state, processFile, processText]
  )

  const handleUploadFile = useCallback(
    async function uploadFile(file: File) {
      markDirty(true)
      setState({ _tag: 'parsing_file', file, progress: 0 })
      await processFile(file, { emptyStringAsNullHeaders: undefined })
    },
    [markDirty, processFile]
  )

  const handleInputText = useCallback(
    async function inputText(text: string) {
      if (text.length === 0) {
        resetAbortController()
        markDirty(false)
        return setState({ _tag: 'no_pasted_text' })
      } else {
        markDirty(true)
        setState({ _tag: 'parsing_text', text, progress: 0 })
        await processTextDebounced(text, {
          emptyStringAsNullHeaders:
            state._tag === 'text_parsed' ? state.emptyStringAsNullHeaders : undefined,
        })
      }
    },
    [state, resetAbortController, markDirty, processTextDebounced]
  )

  const handleRemoveFile = useCallback(
    function removeFile() {
      resetAbortController()
      markDirty(false)
      setState({ _tag: 'no_selected_file' })
    },
    [resetAbortController, markDirty]
  )

  const handleToggleSelectedHeader = useCallback(
    function toggleSelectedHeader(header: string) {
      if (state._tag === 'file_parsed' || state._tag === 'text_parsed') {
        if (!state.data.headers.includes(header)) return

        const selectedHeaders = state.selectedHeaders.includes(header)
          ? state.selectedHeaders.filter((h) => h !== header)
          : [...state.selectedHeaders, header]
        const emptyStringAsNullHeaders = state.emptyStringAsNullHeaders.filter((h) =>
          selectedHeaders.includes(h)
        )
        setState({ ...state, selectedHeaders, emptyStringAsNullHeaders })
      }
    },
    [state]
  )

  const handleSetEmptyStringAsNullHeaders = useCallback(
    function setEmptyStringAsNullHeaders(headers: string[]) {
      if (state._tag === 'file_parsed' || state._tag === 'text_parsed') {
        const nextHeaders = headers.filter((header) => state.selectedHeaders.includes(header))
        processSpreadsheet({ emptyStringAsNullHeaders: nextHeaders })
        setState({ ...state, emptyStringAsNullHeaders: nextHeaders })
      }
    },
    [processSpreadsheet, state]
  )

  return {
    state,
    handleSwitchTab,
    handleToggleSelectedHeader,
    handleSetEmptyStringAsNullHeaders,
    handleUploadFile,
    handleInputText,
    handleRemoveFile,
  }
}
