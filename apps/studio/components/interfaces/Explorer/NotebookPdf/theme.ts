import { StyleSheet } from '@react-pdf/renderer'

/**
 * Hardcoded light-mode values resolved from the dashboard's theme (packages/ui/build/css/themes/light.css,
 * styles/grid.css, MonacoThemeProvider.tsx) — react-pdf can't consume CSS variables, so these are the
 * concrete equivalents of `--background`/`--foreground`/`--muted-foreground`/`--border`/brand green.
 */
export const pdfColors = {
  background: '#ffffff',
  text: '#030303',
  textParagraph: '#3a3a3a',
  textMuted: '#464646',
  textTertiary: '#696969',
  border: '#e9e9e9',
  brand: '#24b47e',
  grayHeader: '#f0f0f0',
  graySqlBox: '#f8f8f8',
  sqlTextColor: '#444444',
  errorText: '#a3402c',
}

export const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: pdfColors.background,
    color: pdfColors.text,
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLogoMark: {
    width: 10,
    height: 10.4,
  },
  headerLogoText: {
    fontSize: 11,
    fontWeight: 700,
    color: pdfColors.text,
  },
  headerLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: pdfColors.textTertiary,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: pdfColors.text,
  },
  headerMeta: {
    fontSize: 8,
    color: pdfColors.textMuted,
  },
  headerRule: {
    marginTop: 12,
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: pdfColors.brand,
  },
  notebookTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: pdfColors.text,
    marginBottom: 6,
  },
  notebookDescription: {
    fontSize: 11,
    color: pdfColors.textMuted,
    marginBottom: 20,
  },
  cellSpacing: {
    marginBottom: 16,
  },

  // Markdown
  heading1: { fontSize: 16, fontWeight: 700, marginTop: 4, marginBottom: 8 },
  heading2: { fontSize: 14, fontWeight: 700, marginTop: 4, marginBottom: 6 },
  heading3: { fontSize: 12, fontWeight: 700, marginTop: 4, marginBottom: 6 },
  heading4: { fontSize: 11, fontWeight: 700, marginTop: 4, marginBottom: 4 },
  heading5: { fontSize: 10, fontWeight: 700, marginTop: 4, marginBottom: 4 },
  heading6: { fontSize: 10, fontWeight: 700, marginTop: 4, marginBottom: 4 },
  paragraph: { fontSize: 10, lineHeight: 1.5, marginBottom: 8, color: pdfColors.textParagraph },
  bold: { fontWeight: 700 },
  italic: { fontStyle: 'italic' },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 9,
    backgroundColor: '#f0f0f0',
    color: pdfColors.text,
  },
  link: { color: pdfColors.brand, textDecoration: 'underline' },
  list: { marginBottom: 8 },
  listItem: { flexDirection: 'row', marginBottom: 3 },
  listItemMarker: { width: 16, fontSize: 10, color: pdfColors.textParagraph },
  listItemContent: { flex: 1, fontSize: 10, lineHeight: 1.5, color: pdfColors.textParagraph },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: pdfColors.border,
    paddingLeft: 8,
    marginBottom: 8,
  },
  thematicBreak: {
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
    marginVertical: 10,
  },

  // Query cells
  queryCard: {
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 4,
    marginBottom: 16,
  },
  queryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: pdfColors.grayHeader,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  queryTitle: { fontSize: 10, fontWeight: 500, color: pdfColors.text },
  sqlBox: {
    backgroundColor: pdfColors.graySqlBox,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  sqlText: { fontFamily: 'Courier', fontSize: 8.5, lineHeight: 1.5, color: pdfColors.sqlTextColor },
  resultsBox: { paddingHorizontal: 10, paddingVertical: 8 },
  resultsPlaceholder: { fontSize: 9, color: pdfColors.textTertiary },
  resultsError: { fontSize: 9, color: pdfColors.errorText },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  resultsHeaderLabel: { fontSize: 8, fontWeight: 700, color: pdfColors.textMuted },
  resultsHeaderCount: { fontSize: 8, color: pdfColors.textTertiary },
  table: { width: '100%' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: pdfColors.border },
  // The card's own footer already draws a top border below the table, so the last row
  // skips its own bottom border rather than stacking a second line on top of that one.
  tableRowLast: { borderBottomWidth: 0 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: pdfColors.grayHeader,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    color: pdfColors.text,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: pdfColors.border,
    overflow: 'hidden',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontWeight: 700,
    color: pdfColors.textMuted,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: pdfColors.border,
  },
  tableCellNull: {
    flex: 1,
    fontSize: 8,
    color: pdfColors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: pdfColors.border,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: pdfColors.border,
  },
  footerText: { fontSize: 8, color: pdfColors.textTertiary },
})
