import { Copy } from 'lucide-react'
import { useState } from 'react'
import { Button, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const CATALOG_URI = 'https://catalog.supabase.example'
const ACCESS_TOKEN_DISPLAY = 'sbw_••••••••••••••••'
const ACCESS_TOKEN_COPY = 'sbw_demo_token_abc123xyz'
const WAREHOUSE_ID = 'wh_demo123'

function CopyRow({
  label,
  display,
  copyValue,
}: {
  label: string
  display: string
  copyValue: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(copyValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-xs text-foreground-light">{label}</p>
        <p className="text-sm font-mono text-foreground truncate">{display}</p>
      </div>
      <Button
        type="button"
        variant="default"
        size="tiny"
        className="shrink-0"
        icon={<Copy size={12} />}
        onClick={handleCopy}
      >
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  )
}

export function WarehouseCatalogPanel() {
  const [enabled, setEnabled] = useState(false)

  return (
    <div className="flex flex-col divide-y">
      <div className="p-8">
        <FormItemLayout
          label="Warehouse catalog integration"
          description="Allow external query engines (DuckDB, Spark, Trino) to read Warehouse-backed tables via the Iceberg catalog API."
          isReactForm={false}
        >
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </FormItemLayout>
      </div>

      {enabled && (
        <div className="p-8 flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground mb-3">Catalog credentials</p>
          <div className="rounded-md border divide-y">
            <div className="px-4">
              <CopyRow label="Catalog URI" display={CATALOG_URI} copyValue={CATALOG_URI} />
            </div>
            <div className="px-4">
              <CopyRow
                label="Access token"
                display={ACCESS_TOKEN_DISPLAY}
                copyValue={ACCESS_TOKEN_COPY}
              />
            </div>
            <div className="px-4">
              <CopyRow
                label="Warehouse identifier"
                display={WAREHOUSE_ID}
                copyValue={WAREHOUSE_ID}
              />
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            Use these credentials to connect DuckDB, Spark, or Trino to your Warehouse tables.
          </p>
        </div>
      )}
    </div>
  )
}
