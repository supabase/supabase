import { Entity } from 'data/table-editor/table-editor-types'
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
  ScrollArea,
  SimpleCodeBlock,
} from 'ui'

interface ExposedMaterializedViewDialogProps {
  table: Entity
  isExposedMaterializedViewDialogOpen: boolean
  setIsExposedMaterializedViewDialogOpen: (isExposedMaterializedViewDialogOpen: boolean) => void
}

export default function ExposedMaterializedViewDialog({
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
          type="secondary"
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
          <p>
            To protect your materialized view from unwanted access to its data, you can pick one of
            three options:
          </p>

          <ul>
            <li>
              <p>
                Revoke <code>select</code> access from API roles <code>anon</code> and{' '}
                <code>authenticated</code>
              </p>
              <div className="border rounded-md">
                <ScrollArea className="px-4 py-2">
                  <SimpleCodeBlock>
                    {`REVOKE SELECT on "${table.schema}"."${table.name}" FROM public, anon, authenticated;`}
                  </SimpleCodeBlock>
                </ScrollArea>
              </div>
            </li>

            <li>
              <p>
                Put a function in front of it and apply a security rule equivalent to RLS in front
                of the function
              </p>
              <div className="border rounded-md">
                <ScrollArea className="px-4 py-2">
                  <SimpleCodeBlock>
                    {`CREATE OR REPLACE FUNCTION get_${table.name}_secure() RETURNS SETOF ${table.schema}.${table.name} LANGUAGE sql AS $$ SELECT * FROM ${table.schema}.${table.name} WHERE user_id = auth.uid();$$;`}
                  </SimpleCodeBlock>
                </ScrollArea>
              </div>
            </li>

            <li>
              <p>
                Put a view in front of the materialized view and apply a rule like
                <code>where uid = auth.uid()</code> directly in the view
              </p>

              <div className="border rounded-md">
                <ScrollArea className="px-4 py-2">
                  <SimpleCodeBlock>
                    {`CREATE VIEW ${table.schema}.${table.name}_secure AS SELECT * FROM ${table.schema}.${table.name} WHERE user_id = auth.uid();`}
                  </SimpleCodeBlock>
                </ScrollArea>
              </div>
            </li>
          </ul>

          <p>Feel free to adjust the queries according to your project's needs.</p>
        </DialogSection>

        <DialogFooter>
          <div className="flex items-center justify-end space-x-2">
            <Button type="default" onClick={() => setIsExposedMaterializedViewDialogOpen(false)}>
              Understood
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
