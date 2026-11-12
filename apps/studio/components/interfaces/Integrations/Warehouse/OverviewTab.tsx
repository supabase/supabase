import { WarehouseSetupPanel } from './WarehouseSetupPanel'

// The marketplace shell supplies its own padding, so returning the content bare avoids
// double-padding it.
export const WarehouseOverviewTab = () => (
  <>
    <p className="mb-6 max-w-2xl text-sm text-foreground-light">
      Run analytical queries for dashboards and reports against a continuously replicated copy of
      your data, keeping that query work off your primary database.
    </p>
    <WarehouseSetupPanel />
  </>
)
