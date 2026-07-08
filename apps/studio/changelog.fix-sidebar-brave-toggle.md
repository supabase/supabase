# Fix: Sidebar invisible in Brave at 100% zoom

Fixes: #47612

Summary
- Added a persistent `SidebarTrigger` button to the header so the left navigation can be toggled even if it's not visible in some browsers at certain zoom levels.
- Replaced `useBreakpoint('md')` (width-based detection) with the matchMedia-based `useIsMobile()` hook to make mobile detection robust to browser zoom quirks.

Files changed
- `apps/studio/components/layouts/Navigation/LayoutHeader/LayoutHeader.tsx`
- `apps/studio/components/layouts/ProjectLayout/LayoutSidebar/index.tsx`

Testing
- Manual verification recommended: run `pnpm dev:studio` and open Studio in Brave at 100% zoom and 200% zoom to confirm the sidebar toggle appears and toggles the sidebar.

Notes
- This change is intentionally small and defensive: it adds a header toggle and more robust mobile detection rather than large CSS rewrites.

