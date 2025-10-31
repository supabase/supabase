import { EnumeratedTypes } from 'components/interfaces/Database'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'

/**
 * Shared page component for Database Enumerated Types
 * Used by both the parent route (/types) and nested routes (/types/new, /types/edit/:id)
 */
export const EnumeratedTypesPage = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent className="!col-span-12">
          <FormHeader
            className="!mb-0"
            title="Database Enumerated Types"
            description="Custom data types that you can use in your database tables or functions."
          />
        </ScaffoldSectionContent>
        <div className="col-span-12 mt-3">
          <EnumeratedTypes />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
