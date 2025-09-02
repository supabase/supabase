import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, type FieldArrayPath } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { array, object, string } from 'yup'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetSection,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Input_Shadcn_,
  TextArea_Shadcn_,
  Button,
  SimpleCodeBlock,
  Card,
  CardContent,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import AIEditor from 'components/ui/AIEditor'

interface LiveQuerySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const schema = object({
  name: string().required('Name is required').matches(/^\S+$/, 'No spaces allowed'),
  parameters: array().of(string().required('Parameter cannot be empty')).default([]),
  sql: string().required('SQL is required'),
})

type FormValues = {
  name: string
  parameters: string[]
  sql: string
}

export const LiveQuerySheet = ({ open, onOpenChange }: LiveQuerySheetProps) => {
  const form = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', parameters: [''], sql: '' },
  })

  const { fields, append, remove } = useFieldArray<FormValues, FieldArrayPath<FormValues>>({
    control: form.control,
    name: 'parameters' as FieldArrayPath<FormValues>,
  })

  const [submitted, setSubmitted] = useState<null | FormValues>(null)

  useEffect(() => {
    if (!open) {
      form.reset({ name: '', parameters: [''], sql: '' })
      setSubmitted(null)
    }
  }, [open])

  const onSubmit = (values: FormValues) => {
    // fake submit: generate SQL outputs and keep sheet open
    setSubmitted({ ...values })
    toast.success('Generated SQL (not executed)')
  }

  const affectedTable = useMemo(() => {
    const sql = submitted?.sql || form.getValues('sql') || ''
    const lowered = sql.toLowerCase()
    const fromMatch = /\bfrom\s+([a-zA-Z0-9_\.\"']+)/.exec(lowered)
    const insertMatch = /\binsert\s+into\s+([a-zA-Z0-9_\.\"']+)/.exec(lowered)
    const updateMatch = /\bupdate\s+([a-zA-Z0-9_\.\"']+)/.exec(lowered)
    const deleteMatch = /\bdelete\s+from\s+([a-zA-Z0-9_\.\"']+)/.exec(lowered)
    const raw = (fromMatch || insertMatch || updateMatch || deleteMatch)?.[1] || 'public.example'
    // strip quotes and split schema.table
    const cleaned = raw.replace(/[\"']/g, '')
    const parts = cleaned.split('.')
    return parts.length === 2
      ? { schema: parts[0], table: parts[1] }
      : { schema: 'public', table: parts[0] }
  }, [submitted])

  const topicPattern = useMemo(() => {
    const name = (submitted?.name || form.getValues('name') || 'topic').trim()
    const params = submitted?.parameters || form.getValues('parameters') || []
    const placeholders = params
      .filter(Boolean)
      .map((p) => `{${p}}`)
      .join('-')
    return placeholders ? `${name}-${placeholders}` : name
  }, [submitted])

  const functionSQL = useMemo(() => {
    if (!submitted) return ''
    const { table } = affectedTable
    const safeName = submitted.name.replace(/[^a-zA-Z0-9_]/g, '_')
    const fnName = `notify_${table}_${safeName}`

    // Build topic from row values
    const concatTopic = submitted.parameters
      .filter(Boolean)
      .map((p) => `'-' || coalesce(coalesce(NEW.${p}::text, OLD.${p}::text), '')`)
      .join(' || ')
    const computedTopic = concatTopic
      ? `('${submitted.name}' || ${concatTopic})`
      : `'${submitted.name}'`

    // Parse SELECT list to determine exactly which fields to include in the payload
    const original = submitted.sql
    const lower = original.toLowerCase()
    const selIdx = lower.indexOf('select')
    let fromIdx = -1
    if (selIdx >= 0) {
      const afterSel = lower.slice(selIdx + 6)
      const idx = afterSel.indexOf('from')
      fromIdx = idx >= 0 ? selIdx + 6 + idx : -1
    }
    const selectListRaw =
      selIdx >= 0 ? original.slice(selIdx + 6, fromIdx > -1 ? fromIdx : original.length) : ''
    const containsWildcard = /\*/.test(selectListRaw)

    type SelectedField = { key: string; col: string }
    const selected: SelectedField[] = []

    const items = selectListRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const part of items) {
      const partTrim = part.trim()
      // Capture alias via AS
      const aliasMatch = partTrim.match(/\bas\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*$/i)
      let expr = partTrim
      let key: string | null = null
      if (aliasMatch && aliasMatch.index !== undefined) {
        key = aliasMatch[1]
        expr = partTrim.slice(0, aliasMatch.index).trim()
      }

      // Remove quotes for expr analysis
      const exprClean = expr.replace(/\"/g, '')

      // Handle wildcard selects, e.g., *, t.*
      if (/^(\w+\.)?\*$/.test(exprClean)) {
        // '*' covered by containsWildcard; skip here
        continue
      }

      // Try to extract base column identifier
      const tokens = exprClean.split(/\s+/)
      const lastToken = tokens[tokens.length - 1]
      let baseCol = (lastToken.split('.').pop() || '').replace(/[^a-zA-Z0-9_]/g, '')
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(baseCol)) {
        selected.push({ key: key || baseCol, col: baseCol })
      }
    }

    // Deduplicate by key while keeping first occurrence
    const deduped: SelectedField[] = []
    const seen = new Set<string>()
    for (const f of selected) {
      if (!seen.has(f.key)) {
        seen.add(f.key)
        deduped.push(f)
      }
    }

    const payloadExpr = containsWildcard
      ? `to_jsonb(coalesce(NEW, OLD))`
      : deduped.length > 0
        ? `jsonb_build_object(${deduped.map((f) => `'${f.key}', coalesce(NEW.${f.col}, OLD.${f.col})`).join(', ')})`
        : `'{}'::jsonb`

    return `create or replace function realtime.${fnName}()
returns trigger
language plpgsql
security definer
as $$
declare
  _payload jsonb;
  _topic text;
begin
  _payload := ${payloadExpr};
  _topic := ${computedTopic};
  perform realtime.send(_payload, 'event', _topic, false);
  if (TG_OP = 'DELETE') then
    return OLD;
  end if;
  return NEW;
end;
$$;`
  }, [submitted, affectedTable])

  const triggerSQL = useMemo(() => {
    if (!submitted) return ''
    const { schema, table } = affectedTable
    const safeName = submitted.name.replace(/[^a-zA-Z0-9_]/g, '_')
    const fnName = `realtime.notify_${table}_${safeName}`
    const trgName = `trg_notify_${table}_${safeName}`
    return `drop trigger if exists ${trgName} on ${schema}.${table};
create trigger ${trgName}
after insert or update or delete on ${schema}.${table}
for each row execute function ${fnName}();`
  }, [submitted, affectedTable])

  const rlsPolicySQL = useMemo(() => {
    if (!submitted) return ''

    const paramNames = submitted.parameters.filter(Boolean)
    const nameSegments = submitted.name.split('-').length

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let injectedSql = submitted.sql
    for (const p of paramNames) {
      const re = new RegExp(`\\{${escapeRegExp(p)}\\}`, 'g')
      injectedSql = injectedSql.replace(re, `(select ${p} from params)`)
    }

    const policyParamsSelect = paramNames.length
      ? paramNames
          .map((p, i) => `split_part(realtime.topic(), '-', ${nameSegments + i + 1}) as ${p}`)
          .join(',\n      ')
      : 'null as _'

    return `create policy "${submitted.name} - adhoc policy"
on "realtime"."messages"
for insert
to authenticated
with check (
  left(realtime.topic(), length('${submitted.name}')) = '${submitted.name}'
  and realtime.messages.extension in ('broadcast')
  and exists (
    with params as (
      select
        ${policyParamsSelect}
    ),
    q as (
      ${injectedSql}
    )
    select 1 from q
  )
);`
  }, [submitted])

  const clientCode = useMemo(() => {
    const name = submitted?.name || form.getValues('name') || 'my_live_query'
    const params = (submitted?.parameters || form.getValues('parameters') || []).filter(Boolean)
    const paramLines = params.map((p) => `  ${p}: ${p}`).join('\n')
    const paramBlock = params.length ? `, {\n${paramLines}\n}` : ''
    return `const { data } = supabase.from('${name}'${paramBlock})`
  }, [submitted])

  const clientChannelCode = useMemo(() => {
    const name = submitted?.name || form.getValues('name') || 'my_live_query'
    const params = (submitted?.parameters || form.getValues('parameters') || []).filter(Boolean)
    const templates = params.map((p) => `\$\{${p}\}`).join('-')
    const topic = templates ? `${name}-\`${templates}\`` : `${name}`
    // Build backticked template literal correctly
    return templates
      ? `const channel = supabase.channel(\`${name}-${templates}\`)`
      : `const channel = supabase.channel(\`${name}\`)`
  }, [submitted])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Create live query</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <SheetSection>
            <Form_Shadcn_ {...form}>
              <form
                id="live-query-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout label="Name" description="No spaces allowed">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ placeholder="orders_live" {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <div className="space-y-2">
                  <div className="text-sm text-foreground">Parameters</div>
                  <div className="space-y-2">
                    {fields.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <FormField_Shadcn_
                          control={form.control}
                          name={`parameters.${idx}` as const}
                          render={({ field }) => (
                            <FormItemLayout layout="flex">
                              <FormControl_Shadcn_>
                                <Input_Shadcn_ placeholder={`param_${idx + 1}`} {...field} />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                        <Button
                          type="default"
                          onClick={() => remove(idx)}
                          disabled={fields.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="default" onClick={() => append('')}>
                      Add parameter
                    </Button>
                  </div>
                </div>

                <FormField_Shadcn_
                  control={form.control}
                  name="sql"
                  render={({ field }) => (
                    <FormItemLayout label="SQL">
                      <FormControl_Shadcn_>
                        <div className="h-64 border rounded-md overflow-hidden">
                          <AIEditor language="sql" value={field.value} onChange={field.onChange} />
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </form>
            </Form_Shadcn_>
          </SheetSection>

          {submitted && (
            <SheetSection>
              <div className="space-y-4">
                <div>
                  <div className="text-sm mb-2 text-foreground">Trigger function</div>
                  <Card>
                    <CardContent>
                      <SimpleCodeBlock className="language-sql">{functionSQL}</SimpleCodeBlock>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <div className="text-sm mb-2 text-foreground">Trigger</div>
                  <Card>
                    <CardContent>
                      <SimpleCodeBlock className="language-sql">{triggerSQL}</SimpleCodeBlock>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <div className="text-sm mb-2 text-foreground">RLS policy</div>
                  <Card>
                    <CardContent>
                      <SimpleCodeBlock className="language-sql">{rlsPolicySQL}</SimpleCodeBlock>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <div className="text-sm mb-2 text-foreground">Client code</div>
                  <Card>
                    <CardContent>
                      <SimpleCodeBlock className="language-ts">{clientCode}</SimpleCodeBlock>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <SimpleCodeBlock className="language-ts">{clientChannelCode}</SimpleCodeBlock>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </SheetSection>
          )}
        </div>
        <SheetFooter>
          <Button type="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" form="live-query-form">
            Save query
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default LiveQuerySheet
