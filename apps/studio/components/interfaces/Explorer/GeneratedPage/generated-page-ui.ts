// Optional browser CSS defaults based on Studio's controls and layout patterns.
// The sandbox has no Tailwind processor or React component runtime.
// Keep geometry aligned with packages/ui/src/lib/constants.ts and ui-patterns.
// Classes are opt-in; the cascade layer lets ordinary generated CSS override even
// interaction states without specificity tricks or !important.
export const GENERATED_PAGE_UI_STYLES = `
@layer studio-page-defaults {
  :where(.studio-page, .studio-page *, .studio-button, .studio-input, .studio-select) {
    box-sizing: border-box;
  }
  :where(.studio-page) {
    width: 100%;
    max-width: 1200px;
    margin-inline: auto;
    padding: clamp(8px, 2vw, 24px);
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing, 0.25rem) * 10);
  }
  :where(.studio-page--full) { max-width: none; }
  :where(.studio-page--narrow) { max-width: 768px; }
  :where(.studio-section) {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing, 0.25rem) * 5);
    min-width: 0;
  }
  :where(.studio-section-header, .studio-toolbar, .studio-actions, .studio-card-footer) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--spacing, 0.25rem) * 2);
    min-width: 0;
  }
  :where(.studio-section-header, .studio-toolbar) { justify-content: space-between; }
  :where(.studio-toolbar > .studio-actions:last-child) { margin-inline-start: auto; }
  :where(.studio-muted) { color: var(--muted-foreground); }
  :where(.studio-description) {
    margin: 0;
    color: var(--muted-foreground);
    font-size: var(--text-sm, 0.8125rem);
  }
  :where(.studio-grid) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
    gap: calc(var(--spacing, 0.25rem) * 4);
    min-width: 0;
  }
  :where(.studio-card) {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 0.5rem);
    background: var(--card);
    color: var(--card-foreground);
  }
  :where(.studio-card-content, .studio-card-footer) {
    padding: calc(var(--spacing, 0.25rem) * 4);
  }
  :where(.studio-card-content + .studio-card-content, .studio-card-footer) {
    border-top: 1px solid var(--border);
  }
  :where(.studio-button, .studio-input, .studio-select) {
    max-width: 100%;
    min-width: 0;
    border: 1px solid var(--input);
    border-radius: var(--radius-md, 0.375rem);
    font-family: inherit;
    font-size: var(--text-sm, 0.8125rem);
    line-height: var(--text-sm--line-height, 1.4286);
    color: var(--foreground);
  }
  :where(.studio-button) {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: calc(var(--spacing, 0.25rem) * 2);
    min-height: 34px;
    padding: calc(var(--spacing, 0.25rem) * 1.5) calc(var(--spacing, 0.25rem) * 3);
    background: var(--card);
    font-size: var(--text-sm, 0.8125rem);
    line-height: var(--text-sm--line-height, 1.4286);
    font-weight: 400;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }
  :where(.studio-button:hover:not(:disabled)) { background: var(--popover); }
  :where(.studio-button--primary) {
    background: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--border-brand);
  }
  :where(.studio-button--primary:hover:not(:disabled)) {
    background: color-mix(in oklab, var(--primary) 85%, var(--background));
  }
  :where(.studio-button--text) { background: transparent; border-color: transparent; }
  :where(.studio-button--text:hover:not(:disabled)) { background: var(--accent); }
  :where(.studio-button--compact) {
    min-height: 26px;
    padding: calc(var(--spacing, 0.25rem)) calc(var(--spacing, 0.25rem) * 2.5);
    font-size: var(--text-xs, 0.75rem);
    line-height: var(--text-xs--line-height, 1.3333);
  }
  :where(.studio-button > svg) { width: 16px; height: 16px; flex-shrink: 0; }
  :where(.studio-button--compact > svg) { width: 14px; height: 14px; }
  :where(.studio-input, .studio-select) {
    width: 100%;
    min-height: 34px;
    padding: calc(var(--spacing, 0.25rem)) calc(var(--spacing, 0.25rem) * 3);
    background: var(--field);
  }
  :where(.studio-select) { background: var(--control); }
  :where(textarea.studio-input) { min-height: 96px; resize: vertical; }
  :where(.studio-input::placeholder) { color: var(--muted-foreground); }
  :where(.studio-button:hover:not(:disabled), .studio-input:hover:not(:disabled), .studio-select:hover:not(:disabled)) {
    border-color: var(--border-control-hover);
  }
  :where(.studio-button:focus-visible, .studio-input:focus-visible, .studio-select:focus-visible) {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  :where(.studio-button:disabled, .studio-input:disabled, .studio-select:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  :where(.studio-input[aria-invalid="true"], .studio-select[aria-invalid="true"]) {
    border-color: var(--destructive);
  }
  :where(.studio-field) {
    display: grid;
    gap: calc(var(--spacing, 0.25rem) * 2);
    font-size: var(--text-sm, 0.8125rem);
    min-width: 0;
  }
  :where(.studio-toolbar .studio-input, .studio-toolbar .studio-select) {
    width: auto;
  }
  :where(.studio-table-container) { max-width: 100%; overflow-x: auto; }
  :where(.studio-table) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm, 0.8125rem);
    text-align: start;
  }
  :where(.studio-table th, .studio-table td) {
    padding: calc(var(--spacing, 0.25rem) * 3) calc(var(--spacing, 0.25rem) * 4);
    border-bottom: 1px solid var(--border);
    overflow-wrap: normal;
    vertical-align: middle;
  }
  :where(.studio-table th) {
    height: 40px;
    color: var(--muted-foreground);
    font-weight: var(--font-weight-medium, 500);
    text-align: start;
    white-space: nowrap;
  }
  :where(.studio-table time, .studio-nowrap) { white-space: nowrap; }
  :where(.studio-table .studio-text) {
    min-width: 16rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  :where(.studio-table tbody tr:hover) { background: var(--accent); }
  :where(.studio-table tbody tr:last-child td) { border-bottom: 0; }
  :where(.studio-number) { text-align: end; font-variant-numeric: tabular-nums; }
  :where(.studio-table th.studio-number) { text-align: end; }
  :where(.studio-badge) {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--muted);
    color: var(--foreground);
    font-size: var(--text-xs, 0.75rem);
  }
  :where(.studio-metrics) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: calc(var(--spacing, 0.25rem) * 4);
    margin: 0;
  }
  :where(.studio-metrics dt) {
    color: var(--muted-foreground);
    font-size: var(--text-sm, 0.8125rem);
  }
  :where(.studio-metrics dd) {
    margin: calc(var(--spacing, 0.25rem)) 0 0;
    font-size: var(--text-xl, 1.125rem);
    font-variant-numeric: tabular-nums;
  }
  :where(.studio-card .studio-metrics dd) { font-size: var(--text-base, 0.9375rem); }
  :where(.studio-metrics--summary dd) { font-size: var(--text-2xl, 1.375rem); }
  :where(.studio-state) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--spacing, 0.25rem) * 2);
    padding: calc(var(--spacing, 0.25rem) * 4);
    font-size: var(--text-sm, 0.8125rem);
    overflow-wrap: anywhere;
  }
  :where(.studio-state p) { margin: 0; }
  :where(.studio-state--error) {
    border-inline-start: 2px solid var(--destructive);
    background: color-mix(in oklab, var(--destructive) 5%, transparent);
  }
  :where([hidden]) { display: none; }
  @media (pointer: coarse) {
    :where(.studio-button, .studio-input, .studio-select) { min-height: 44px; }
    :where(.studio-toolbar .studio-input, .studio-toolbar .studio-select) { min-height: 44px; }
    :where(.studio-input, .studio-select, .studio-toolbar .studio-input, .studio-toolbar .studio-select) {
      font-size: max(16px, var(--text-sm, 0.8125rem));
    }
  }
}
`
