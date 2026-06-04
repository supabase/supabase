'use client'

import { Loader2, Mic, Square } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import { Button, cn } from 'ui'

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

type SpeechInputMode = 'speech-recognition' | 'media-recorder' | 'none'

type SpeechInputProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'type'> & {
  onTranscriptionChange?: (text: string) => void
  onAudioRecorded?: (audioBlob: Blob) => Promise<string>
  onListeningChange?: (isListening: boolean) => void
  lang?: string
  buttonClassName?: string
}

function detectSpeechInputMode(): SpeechInputMode {
  if (typeof window === 'undefined') {
    return 'none'
  }

  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    return 'speech-recognition'
  }

  if ('MediaRecorder' in window && 'mediaDevices' in navigator) {
    return 'media-recorder'
  }

  return 'none'
}

function SpeechInput({
  className,
  buttonClassName,
  onTranscriptionChange,
  onAudioRecorded,
  onListeningChange,
  lang = 'en-US',
  disabled,
  ...props
}: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mode] = useState<SpeechInputMode>(detectSpeechInputMode)
  const [isRecognitionReady, setIsRecognitionReady] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const accumulatedTranscriptRef = useRef('')
  const onTranscriptionChangeRef = useRef(onTranscriptionChange)
  const onAudioRecordedRef = useRef(onAudioRecorded)

  onTranscriptionChangeRef.current = onTranscriptionChange
  onAudioRecordedRef.current = onAudioRecorded

  useEffect(() => {
    onListeningChange?.(isListening)
  }, [isListening, onListeningChange])

  const emitTranscription = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    onTranscriptionChangeRef.current?.(trimmed)
  }, [])

  useEffect(() => {
    if (mode !== 'speech-recognition') {
      return
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    const speechRecognition = new SpeechRecognitionCtor()

    speechRecognition.continuous = true
    speechRecognition.interimResults = true
    speechRecognition.lang = lang

    const handleStart = () => {
      accumulatedTranscriptRef.current = ''
      setIsListening(true)
    }

    const handleEnd = () => {
      setIsListening(false)
      emitTranscription(accumulatedTranscriptRef.current)
      accumulatedTranscriptRef.current = ''
    }

    const handleResult = (event: Event) => {
      const speechEvent = event as SpeechRecognitionEvent

      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i += 1) {
        const result = speechEvent.results[i]
        if (result.isFinal) {
          accumulatedTranscriptRef.current += result[0]?.transcript ?? ''
        }
      }
    }

    const handleError = () => {
      setIsListening(false)
      accumulatedTranscriptRef.current = ''
    }

    speechRecognition.addEventListener('start', handleStart)
    speechRecognition.addEventListener('end', handleEnd)
    speechRecognition.addEventListener('result', handleResult)
    speechRecognition.addEventListener('error', handleError)

    recognitionRef.current = speechRecognition
    setIsRecognitionReady(true)

    return () => {
      speechRecognition.removeEventListener('start', handleStart)
      speechRecognition.removeEventListener('end', handleEnd)
      speechRecognition.removeEventListener('result', handleResult)
      speechRecognition.removeEventListener('error', handleError)
      speechRecognition.stop()
      recognitionRef.current = null
      setIsRecognitionReady(false)
    }
  }, [emitTranscription, lang, mode])

  useEffect(
    () => () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop()
        }
      }
    },
    []
  )

  const startMediaRecorder = useCallback(async () => {
    if (!onAudioRecordedRef.current) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      const handleDataAvailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      const handleStop = async () => {
        for (const track of stream.getTracks()) {
          track.stop()
        }
        streamRef.current = null

        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        })

        if (audioBlob.size > 0 && onAudioRecordedRef.current) {
          setIsProcessing(true)
          try {
            const transcript = await onAudioRecordedRef.current(audioBlob)
            if (transcript) {
              emitTranscription(transcript)
            }
          } catch {
            // Caller handles transcription errors.
          } finally {
            setIsProcessing(false)
          }
        }
      }

      const handleError = () => {
        setIsListening(false)
        for (const track of stream.getTracks()) {
          track.stop()
        }
        streamRef.current = null
      }

      mediaRecorder.addEventListener('dataavailable', handleDataAvailable)
      mediaRecorder.addEventListener('stop', handleStop)
      mediaRecorder.addEventListener('error', handleError)

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }, [emitTranscription])

  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (mode === 'speech-recognition' && recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
      } else {
        recognitionRef.current.start()
      }
      return
    }

    if (mode === 'media-recorder') {
      if (isListening) {
        stopMediaRecorder()
      } else {
        startMediaRecorder()
      }
    }
  }, [isListening, mode, startMediaRecorder, stopMediaRecorder])

  if (mode === 'none') {
    return null
  }

  if (mode === 'media-recorder' && !onAudioRecorded) {
    return null
  }

  const isDisabled =
    disabled ||
    (mode === 'speech-recognition' && !isRecognitionReady) ||
    isProcessing

  return (
    <div className={cn('relative size-7 shrink-0', className)}>
      {isListening &&
        [0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full bg-brand-500/25 animate-ping',
              index === 1 && '[animation-delay:150ms]',
              index === 2 && '[animation-delay:300ms]'
            )}
            style={{ animationDuration: '1.5s' }}
          />
        ))}

      <Button
        {...props}
        type={isListening ? 'primary' : 'default'}
        size="tiny"
        htmlType="button"
        disabled={isDisabled}
        onClick={toggleListening}
        className={cn(
          'relative z-10 flex size-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-full !p-0',
          isListening && 'border-brand-600 bg-brand-600 hover:bg-brand-500',
          buttonClassName
        )}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isListening}
      >
        {isProcessing && <Loader2 size={14} className="animate-spin" />}
        {!isProcessing && isListening && <Square size={12} className="fill-current" />}
        {!(isProcessing || isListening) && <Mic size={14} />}
      </Button>
    </div>
  )
}

export { SpeechInput }
export type { SpeechInputProps }
