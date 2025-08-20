import { SurveyChart } from '../SurveyChart'

// Helper function to convert filters to the format expected by the database function
function buildFunctionParams(activeFilters: Record<string, string>) {
  const params: Record<string, any> = {}

  // Convert single values to arrays for the function parameters
  if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
    params.person_age_filter = [activeFilters.person_age]
  }
  if (activeFilters.location && activeFilters.location !== 'unset') {
    params.location_filter = [activeFilters.location]
  }
  if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
    params.money_raised_filter = [activeFilters.money_raised]
  }
  // if (activeFilters.team_size && activeFilters.team_size !== 'unset') {
  //   params.team_size_filter = [activeFilters.team_size]
  // }

  return params
}

export function AcceleratorParticipationChart() {
  return (
    <SurveyChart
      title="If your startup has participated in an accelerator, which one?"
      targetColumn="accelerator_participation"
      filterColumns={['person_age', 'location', 'money_raised']}
      functionName="get_accelerator_stats"
      functionParams={buildFunctionParams}
    />
  )
}
