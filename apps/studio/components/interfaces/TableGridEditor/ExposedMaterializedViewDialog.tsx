import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { SimpleCodeBlock } from 'ui-patterns/SimpleCodeBlock'

import { Entity } from '@/data/table-editor/table-editor-types'

interface ExposedMaterializedViewDialogProps {
  table: Entity
  isExposedMaterializedViewDialogOpen: boolean
  setIsExposedMaterializedViewDialogOpen: (isExposedMaterializedViewDialogOpen: boolean) => void
}

export function ExposedMaterializedViewDialog({
  table,
  isExposedMaterializedViewDialogOpen,
  setIsExposedMaterializedViewDialogOpen,
}: ExposedMaterializedViewDialogProps) {
  return (
    <Dialog
      open={isExposedMaterializedViewDialogOpen}
      onOpenChange={setIsExposedMaterializedViewDialogOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="tiny"
          onClick={() => setIsExposedMaterializedViewDialogOpen(true)}
        >
          Check possible options
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Materialized view exposed via Data API</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="text-sm text-foreground-light space-y-2 prose">
          <p>
            Revoking <code>select</code> access from API roles <code>anon</code> and{' '}
            <code>authenticated</code> mitigates the risk of exposing sensitive data to all users.
          </p>
          <SimpleCodeBlock>
            {`REVOKE SELECT on "${table.schema}"."${table.name}"
FROM public, anon, authenticated;`}
          </SimpleCodeBlock>
          <p>
            Note that this is a breaking change if you have code that depends on accessing the
            materialized view using the Data API. To reexpose the materialized view in a safe way,
            you can put a function in front of it and apply a security rule equivalent to RLS:
          </p>
          <SimpleCodeBlock>
            {`CREATE OR REPLACE FUNCTION get_${table.name}_secure()
RETURNS SETOF "${table.schema}"."${table.name}"
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT * FROM "${table.schema}"."${table.name}"
  WHERE user_id = (SELECT auth.uid());
$$;`}
          </SimpleCodeBlock>
        </DialogSection>

        <DialogFooter>
          <div className="flex items-center justify-end space-x-2">
            <Button variant="default" onClick={() => setIsExposedMaterializedViewDialogOpen(false)}>
              Understood
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
