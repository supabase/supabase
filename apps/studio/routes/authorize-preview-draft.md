# Draft consent preview

Before marking the PR ready, remove the development-only scenario menu and its feature-flag bypass from `authorize.tsx`. This includes `CONSENT_PREVIEWS`, the preview-specific remount key, and the dropdown imports. Keep fixture routes that reviewers or tests still need behind the normal scoped OAuth flag.

Remove this marker in the same change. Confirm the live data source and the required consent disclosures before calling the flow ready to ship.
