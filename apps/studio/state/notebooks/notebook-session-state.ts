/**
 * Ephemeral, per-session notebook state that is NOT persisted: query cell
 * results and the row limit. Kept separate from the notebook content store
 * (which deals with persistence) because none of this is saved — it lives
 * only for the current editing session, keyed by cell id rather than
 * notebook id since a single notebook can have many independent query cells.
 *
 * [Joshen] Will be fleshed out in subsequent PRs
 */
