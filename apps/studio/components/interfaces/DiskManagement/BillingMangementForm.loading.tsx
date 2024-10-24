import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { Form_Shadcn_, Separator, Skeleton } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export function DiskManagementFormLoading() {
  return (
    <Form_Shadcn_>
      <form className="flex flex-col gap-8">
        <ScaffoldContainer className="relative flex flex-col gap-10" bottomPadding>
          <Separator />

          <FormItemLayout
            label="Compute size"
            layout="horizontal"
            isReactForm={false}
            labelOptional={<p>Hardware resources allocated to your postgres database</p>}
          >
            <div className="grid grid-cols-3 flex-wrap gap-3">
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
              <Skeleton className="bg-surface-300 block w-full h-[110px]" />
            </div>
          </FormItemLayout>

          <Separator />

          <FormItemLayout label="Storage type" layout="horizontal" isReactForm={false}>
            <div className="grid grid-cols-2 flex-wrap gap-3">
              <Skeleton className="bg-surface-300 block w-full h-21" />
              <Skeleton className="bg-surface-300 block w-full h-21" />
            </div>
          </FormItemLayout>

          {/* <FormItemLayout
          label="Compute size"
          layout="horizontal"
          isReactForm={false}
          labelOptional="hardware resources allocated to your postgres database"
        >
          <Skeleton className="bg-surface-300 w-100 h-12" />
          <Skeleton className="bg-surface-300 w-100 h-12" />
          <Skeleton className="bg-surface-300 w-100 h-12" />
        </FormItemLayout>

        <FormItemLayout
          label="Compute size"
          layout="horizontal"
          isReactForm={false}
          labelOptional="hardware resources allocated to your postgres database"
        >
          <Skeleton className="bg-surface-300 w-100 h-10" />
        </FormItemLayout> */}
        </ScaffoldContainer>
      </form>
    </Form_Shadcn_>
  )
}
