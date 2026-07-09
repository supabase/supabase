'use client'

import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, TextArea } from 'ui'

import { ActivityForm } from '@/components/quick-add/activity-form'
import { LeadForm } from '@/components/quick-add/lead-form'
import { QuoteForm } from '@/components/quick-add/quote-form'
import { toDatetimeLocalValue } from '@/lib/datetime-local'
import { extractVoiceDraft, type ExtractVoiceDraftState } from '@/lib/ai/extract-voice-draft'
import type { VoiceDraft } from '@/lib/ai/voice-draft'

interface VoiceFormProps {
  leadOptions: { id: string; name: string; company: string | null }[]
  onSuccess: () => void
}

function matchLeadId(
  hint: string | null | undefined,
  leadOptions: { id: string; name: string }[]
) {
  if (!hint) return undefined
  const needle = hint.trim().toLowerCase()
  if (!needle) return undefined
  return leadOptions.find((lead) => lead.name.toLowerCase().includes(needle))?.id
}

export function VoiceForm({ leadOptions, onSuccess }: VoiceFormProps) {
  const [supported, setSupported] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [result, setResult] = useState<ExtractVoiceDraftState | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript
        }
      }
      if (finalText) {
        setTranscript((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText.trim()))
      }
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  function toggleRecording() {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      recognition.start()
      setIsRecording(true)
    }
  }

  async function handleGenerateDraft() {
    setIsExtracting(true)
    setResult(null)
    const state = await extractVoiceDraft(transcript)
    setResult(state)
    setIsExtracting(false)
  }

  function reset() {
    setTranscript('')
    setResult(null)
  }

  if (result?.draft) {
    return <DraftReview draft={result.draft} leadOptions={leadOptions} onSuccess={onSuccess} onDiscard={reset} />
  }

  return (
    <div className="flex flex-col gap-4">
      {!supported && (
        <p className="text-xs text-foreground-light">
          Voice capture isn&apos;t supported in this browser — type your update below instead.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <TextArea
          rows={5}
          placeholder="e.g. Just spoke with Jamie at Acme, they want a quote for 5,000 by Friday"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
        {supported && (
          <Button
            type="button"
            variant={isRecording ? 'danger' : 'outline'}
            block
            icon={isRecording ? <Square size={14} /> : <Mic size={14} />}
            onClick={toggleRecording}
          >
            {isRecording ? 'Stop recording' : 'Record update'}
          </Button>
        )}
      </div>

      {result?.error && <p className="text-sm text-destructive-600">{result.error}</p>}

      <Button type="button" block loading={isExtracting} disabled={!transcript.trim()} onClick={handleGenerateDraft}>
        Generate draft
      </Button>
    </div>
  )
}

function DraftReview({
  draft,
  leadOptions,
  onSuccess,
  onDiscard,
}: {
  draft: VoiceDraft
  leadOptions: { id: string; name: string; company: string | null }[]
  onSuccess: () => void
  onDiscard: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-foreground-light">
        Review the draft below, make any changes, then save.
      </p>

      {draft.entity === 'lead' && draft.lead && (
        <LeadForm
          key="voice-lead"
          onSuccess={onSuccess}
          defaultValues={{
            name: draft.lead.name,
            company: draft.lead.company,
            email: draft.lead.email,
            phone: draft.lead.phone,
            source: draft.lead.source,
            status: draft.lead.status,
            estimated_value: draft.lead.estimated_value,
            notes: draft.lead.notes,
          }}
        />
      )}

      {draft.entity === 'quote' && draft.quote && (
        <QuoteForm
          key="voice-quote"
          leadOptions={leadOptions}
          onSuccess={onSuccess}
          defaultValues={{
            title: draft.quote.title,
            amount: draft.quote.amount,
            stage: draft.quote.stage,
            valid_until: draft.quote.valid_until,
            notes: draft.quote.notes,
            lead_id: matchLeadId(draft.quote.lead_name_hint, leadOptions),
          }}
        />
      )}

      {draft.entity === 'activity' && draft.activity && (
        <ActivityForm
          key="voice-activity"
          leadOptions={leadOptions}
          onSuccess={onSuccess}
          defaultValues={{
            subject: draft.activity.subject,
            type: draft.activity.type,
            notes: draft.activity.notes,
            due_at: toDatetimeLocalValue(draft.activity.due_at),
            lead_id: matchLeadId(draft.activity.lead_name_hint, leadOptions),
          }}
        />
      )}

      <Button type="button" variant="text" size="tiny" onClick={onDiscard}>
        Start over
      </Button>
    </div>
  )
}
