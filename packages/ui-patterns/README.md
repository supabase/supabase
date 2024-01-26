# Supabase UI Patterns

This is for multi component based interfaces/patterns.
Usually components in this package are constructed using various components from /ui.

This package does not have a barrel file - each component has to be imported from its index (`ui-patterns/PrivacySettings`, for example).
This is intentional so that adding a new component which is used only in 1 or 2 apps doesn't burden the rest of the apps.
